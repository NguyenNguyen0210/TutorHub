using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Disputes.Commands.AdminResolveDispute;
using TutorHub.Application.Features.Disputes.Commands.CreateDispute;
using TutorHub.Application.Features.Disputes.Commands.UploadDisputeEvidence;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Application.Features.Sessions.SubmitAttendance;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// F-30: attendance payout + post-release dispute settlement on real Postgres —
/// dual-Attended release, BalanceHold, fee-balance formula
/// (StudentRefund = TutorNetRecovery + PlatformFeeReversal), and F-04/F-22
/// anti-chaining enforcement inside SaveChangesAsync.
/// </summary>
public class DisputeFlowTests : IntegrationTestBase
{
    public DisputeFlowTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    private async Task<(Guid AdminId, Guid StudentUserId, Session Session)> SetupPaidSessionAsync()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
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

        // Schedule in the past at domain level (availability is handler-level concern).
        session.Schedule(DateTime.UtcNow.AddHours(-3), DateTime.UtcNow.AddHours(-2));
        await Db.SaveChangesAsync();

        return (admin.Id, studentUser.Id, session);
    }

    [Fact]
    public async Task DualAttended_ReleasesPayout_ThenPartialRefund_ReconcilesFee()
    {
        // Arrange
        var (adminId, studentUserId, session) = await SetupPaidSessionAsync();

        SetCurrentUser(studentUserId, UserRole.Student);
        await SendAsync(new SubmitAttendanceCommand(session.Id, AttendanceStatus.Attended));
        var tutorUserId = (await Db.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile)
            .FirstAsync(s => s.Id == session.Id)).Enrollment.TutorProfile.UserId;
        SetCurrentUser(tutorUserId, UserRole.Tutor);
        var completed = await SendAsync(new SubmitAttendanceCommand(session.Id, AttendanceStatus.Attended));

        completed.Status.Should().Be(SessionStatus.Completed);

        var payoutTx = await Db.Transactions.AsNoTracking().FirstAsync(t =>
            t.SessionId == session.Id && t.Type == TransactionType.SessionPayoutCredit);
        payoutTx.Status.Should().Be(TransactionStatus.Released);
        payoutTx.Amount.Should().Be(300_000m);
        payoutTx.CommissionAmount.Should().Be(30_000m);
        payoutTx.PayoutAmount.Should().Be(270_000m);

        // Act: student disputes post-release, admin grants partial refund of 100k.
        SetCurrentUser(studentUserId, UserRole.Student);
        var dispute = await SendAsync(new CreateDisputeCommand(
            SessionId: session.Id,
            Reason: DisputeReason.QualityIssue,
            Description: "The tutor ended the session 20 minutes early, verified by chat log."));

        dispute.HoldType.Should().Be(FinancialHoldType.BalanceHold);

        // Q3: financial resolution requires at least one evidence.
        await SendAsync(new UploadDisputeEvidenceCommand(
            DisputeId: dispute.Id,
            FileName: "chat-screenshot.png",
            FileUrl: "disputes/chat-screenshot.png",
            ContentType: "image/png",
            FileSizeBytes: 123_456));

        SetCurrentUser(adminId, UserRole.Admin);
        await SendAsync(new AdminResolveDisputeCommand(
            DisputeId: dispute.Id,
            Decision: DisputeResolutionDecision.StudentWinsPartialRefund,
            CustomRefundAmount: 100_000m,
            AdminNotes: "Partially upheld with chat evidence."));

        // Assert: StudentRefund(100k) = TutorNetRecovery(90k) + PlatformFeeReversal(10k).
        var refund = await Db.Transactions.AsNoTracking().FirstAsync(t =>
            t.SessionId == session.Id && t.Type == TransactionType.StudentRefund);
        refund.Amount.Should().Be(100_000m);
        refund.Status.Should().Be(TransactionStatus.Pending);

        var reversal = await Db.Transactions.AsNoTracking().FirstAsync(t =>
            t.SessionId == session.Id && t.Type == TransactionType.PlatformFeeReversal);
        reversal.CommissionAmount.Should().Be(10_000m);

        // F-04/F-22 fee-balance formula: refund(100k) = recovery(90k) + fee reversal(10k).
        // Gross 300k - refund 100k = final gross 200k; final fee 20k; final net 180k;
        // recovery = 270k - 180k = 90k; reversal = 30k - 20k = 10k.
        var tutorNetRecovery = payoutTx.PayoutAmount - 180_000m;
        tutorNetRecovery.Should().Be(90_000m);
        (tutorNetRecovery + reversal.CommissionAmount).Should().Be(refund.Amount);

        var enrollment = await Db.Enrollments.AsNoTracking().FirstAsync(e => e.BookingId == payoutTx.BookingId);
        var wallet = await Db.Wallets.AsNoTracking().FirstAsync(w => w.TutorProfileId == enrollment.TutorProfileId);
        // 1,000,000 seeded + 270,000 payout - 90,000 recovery = 1,180,000.
        wallet.AvailableBalance.Should().Be(1_180_000m);
        wallet.HeldBalance.Should().Be(0m);
    }

    [Fact]
    public async Task DuplicateActiveDispute_ThrowsConflict()
    {
        // Arrange
        var (_, studentUserId, session) = await SetupPaidSessionAsync();

        SetCurrentUser(studentUserId, UserRole.Student);
        await SendAsync(new CreateDisputeCommand(
            SessionId: session.Id,
            Reason: DisputeReason.QualityIssue,
            Description: "First dispute with sufficient description length."));

        // Act
        var act = () => SendAsync(new CreateDisputeCommand(
            SessionId: session.Id,
            Reason: DisputeReason.QualityIssue,
            Description: "Second dispute with sufficient description length."));

        // Assert
        await act.Should().ThrowAsync<TutorHub.Application.Common.Exceptions.ConflictException>();
    }

    [Fact]
    public async Task ChainedAdjustment_ThrowsInsideSaveChanges()
    {
        // Arrange: a settled payout + a first-level refund adjustment.
        // BookingId must reference a real booking (FK).
        var (_, _, session) = await SetupPaidSessionAsync();
        var bookingId = (await Db.Enrollments.AsNoTracking()
            .FirstAsync(e => e.Id == session.EnrollmentId)).BookingId;
        var payoutTx = new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            SessionId = session.Id,
            Amount = 300_000m,
            Type = TransactionType.SessionPayoutCredit,
            Status = TransactionStatus.Released,
            CommissionRate = 0.10m,
            CommissionAmount = 30_000m,
            PayoutAmount = 270_000m,
            CreatedAt = DateTime.UtcNow,
            ReleasedAt = DateTime.UtcNow
        };
        var firstRefund = new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = payoutTx.BookingId,
            SessionId = session.Id,
            Amount = 50_000m,
            Type = TransactionType.StudentRefund,
            Status = TransactionStatus.Pending,
            RelatedTransactionId = payoutTx.Id,
            CreatedAt = DateTime.UtcNow
        };
        Db.Transactions.AddRange(payoutTx, firstRefund);
        await Db.SaveChangesAsync();

        // Act: chain a second adjustment onto the refund (F-04/F-22 violation).
        Db.Transactions.Add(new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = payoutTx.BookingId,
            SessionId = session.Id,
            Amount = 10_000m,
            Type = TransactionType.StudentRefund,
            Status = TransactionStatus.Pending,
            RelatedTransactionId = firstRefund.Id,
            CreatedAt = DateTime.UtcNow
        });

        // Assert
        var act = () => Db.SaveChangesAsync();
        await act.Should().ThrowAsync<InvalidOperationException>();
    }
}
