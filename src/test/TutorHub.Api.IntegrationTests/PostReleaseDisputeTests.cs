using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Disputes.Commands.AdminResolveDispute;
using TutorHub.Application.Features.Disputes.Commands.CreateDispute;
using TutorHub.Application.Features.Disputes.Commands.FastTrackResolveDispute;
using TutorHub.Application.Features.Disputes.Commands.UploadDisputeEvidence;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Application.Features.Sessions.SubmitAttendance;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// P0-F2: post-release dispute semantics on real Postgres.
///
/// The suite already covers the funded partial-refund path; these tests cover the
/// boundaries the money invariants hang on: DEC-S8-028 (when the released net can no
/// longer be recovered the system must hold exactly 0 and escalate to an admin rather
/// than reserve a partial amount), the full-refund conservation identity, and the
/// fast-track refusal once escrow has already been released.
/// </summary>
public class PostReleaseDisputeTests : IntegrationTestBase
{
    public PostReleaseDisputeTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task PostRelease_WhenWithdrawableIsInsufficient_AllocatesZeroHoldAndFlagsIntervention()
    {
        // Arrange: released payout, then the tutor moves the money out (a withdrawal),
        // so this session's net can no longer be recovered from the wallet.
        var (_, studentUserId, session) = await SetupReleasedPayoutAsync();

        var wallet = await Db.Wallets.FirstAsync(w => w.TutorProfileId == session.Enrollment.TutorProfileId);
        wallet.DebitAvailable(wallet.AvailableBalance, DateTime.UtcNow);
        await Db.SaveChangesAsync();

        // Act
        SetCurrentUser(studentUserId, UserRole.Student);
        var dispute = await SendAsync(new CreateDisputeCommand(
            SessionId: session.Id,
            Reason: DisputeReason.QualityIssue,
            Description: "Post-release dispute filed after the tutor withdrew the earnings."));

        // Assert: zero partial hold, escalated to admin (DEC-S8-028 / INV-DISP-008).
        var stored = await Db.Disputes.AsNoTracking().FirstAsync(d => d.Id == dispute.Id);
        stored.HeldAmount.Should().Be(0m);
        stored.HoldType.Should().Be(FinancialHoldType.BalanceHold);
        stored.HoldStatus.Should().Be(FinancialHoldStatus.InsufficientFunds);
        stored.Status.Should().Be(DisputeStatus.RequiresAdminFinancialIntervention);
        stored.AdminNotes.Should().Contain("insufficient");

        var freshWallet = await Db.Wallets.AsNoTracking()
            .FirstAsync(w => w.TutorProfileId == session.Enrollment.TutorProfileId);
        freshWallet.HeldBalance.Should().Be(0m);
        freshWallet.AvailableBalance.Should().Be(0m);

        var holdEntries = await Db.WalletTransactions.AsNoTracking()
            .Where(t => t.DisputeId == dispute.Id)
            .ToListAsync();
        holdEntries.Should().BeEmpty("no partial hold may be reserved when the full amount is unavailable");
    }

    [Fact]
    public async Task PostRelease_FullRefund_ConservesFeeIdentityAndUnwindsHold()
    {
        // Arrange
        var (adminId, studentUserId, session) = await SetupReleasedPayoutAsync();

        var payoutTx = await Db.Transactions.AsNoTracking().FirstAsync(t =>
            t.SessionId == session.Id && t.Type == TransactionType.SessionPayoutCredit);

        SetCurrentUser(studentUserId, UserRole.Student);
        var dispute = await SendAsync(new CreateDisputeCommand(
            SessionId: session.Id,
            Reason: DisputeReason.QualityIssue,
            Description: "The session was never delivered; a full refund is requested."));

        var heldWallet = await Db.Wallets.AsNoTracking()
            .FirstAsync(w => w.TutorProfileId == session.Enrollment.TutorProfileId);
        heldWallet.HeldBalance.Should().Be(270_000m, "a post-release dispute reserves the released net");

        // Q3: a financial resolution requires at least one piece of evidence.
        await SendAsync(new UploadDisputeEvidenceCommand(
            DisputeId: dispute.Id,
            FileName: "proof.png",
            FileUrl: "disputes/proof.png",
            ContentType: "image/png",
            FileSizeBytes: 4096));

        // Act
        SetCurrentUser(adminId, UserRole.Admin);
        await SendAsync(new AdminResolveDisputeCommand(
            DisputeId: dispute.Id,
            Decision: DisputeResolutionDecision.StudentWinsFullRefund,
            CustomRefundAmount: null,
            AdminNotes: "Full refund: no session was delivered."));

        // Assert: StudentRefund ≡ TutorNetRecovery + PlatformFeeReversal (DEC-S8-025).
        var refund = await Db.Transactions.AsNoTracking().FirstAsync(t =>
            t.SessionId == session.Id && t.Type == TransactionType.StudentRefund);
        refund.Amount.Should().Be(300_000m);
        refund.Status.Should().Be(TransactionStatus.Succeeded);
        refund.RelatedTransactionId.Should().Be(payoutTx.Id, "adjustments point at the original payout, never at another adjustment");

        var reversal = await Db.Transactions.AsNoTracking().FirstAsync(t =>
            t.SessionId == session.Id && t.Type == TransactionType.PlatformFeeReversal);
        reversal.CommissionAmount.Should().Be(30_000m);

        // A full refund leaves the tutor with 0 net from this session, so the
        // recovery is the whole payout and the reversal is the whole platform fee.
        const decimal finalTutorNet = 0m;
        (payoutTx.PayoutAmount - finalTutorNet + reversal.CommissionAmount).Should().Be(refund.Amount);

        var wallet = await Db.Wallets.AsNoTracking()
            .FirstAsync(w => w.TutorProfileId == session.Enrollment.TutorProfileId);
        wallet.AvailableBalance.Should().Be(1_000_000m);
        wallet.HeldBalance.Should().Be(0m);
    }

    [Fact]
    public async Task FastTrack_OnPostReleaseDispute_IsRefused()
    {
        // Arrange
        var (adminId, studentUserId, session) = await SetupReleasedPayoutAsync();

        SetCurrentUser(studentUserId, UserRole.Student);
        var dispute = await SendAsync(new CreateDisputeCommand(
            SessionId: session.Id,
            Reason: DisputeReason.QualityIssue,
            Description: "Post-release dispute that must not take the fast-track path."));

        // Act
        SetCurrentUser(adminId, UserRole.Admin);
        var act = () => SendAsync(new FastTrackResolveDisputeCommand(
            DisputeId: dispute.Id,
            AdminNotes: "Attempting fast-track on an already released payout."));

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("pre-release escrow only"),
            "post-release disputes require full investigation instead of the fast-track template");
    }

    /// <summary>
    /// Seeds a paid session whose payout has already been released (dual Attended), so
    /// disputes against it follow the post-release branch.
    /// </summary>
    private async Task<(Guid AdminId, Guid StudentUserId, Session Session)> SetupReleasedPayoutAsync()
    {
        var (tutorUser, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);

        SetCurrentUser(studentUser.Id, UserRole.Student);
        var bookingDto = await SendAsync(new CreateBookingCommand(service.Id));

        var booking = await Db.Bookings
            .Include(b => b.StudentProfile)
            .Include(b => b.TutorProfile)
            .FirstAsync(b => b.Id == bookingDto.Id);

        var activation = Scope.ServiceProvider.GetRequiredService<IEnrollmentActivationService>();
        await activation.ActivateAsync(booking, DateTime.UtcNow, CancellationToken.None);
        booking.Status = BookingStatus.Paid;
        await Db.SaveChangesAsync();

        var session = await Db.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile)
            .FirstAsync(s => s.Enrollment.BookingId == booking.Id && s.SessionNumber == 1);

        // Schedule in the past at domain level (availability is a handler-level concern).
        session.Schedule(DateTime.UtcNow.AddHours(-3), DateTime.UtcNow.AddHours(-2));
        await Db.SaveChangesAsync();

        SetCurrentUser(studentUser.Id, UserRole.Student);
        await SendAsync(new SubmitAttendanceCommand(session.Id, AttendanceStatus.Attended));

        SetCurrentUser(tutorUser.Id, UserRole.Tutor);
        var completed = await SendAsync(new SubmitAttendanceCommand(session.Id, AttendanceStatus.Attended));
        completed.Status.Should().Be(SessionStatus.Completed);

        return (admin.Id, studentUser.Id, session);
    }
}
