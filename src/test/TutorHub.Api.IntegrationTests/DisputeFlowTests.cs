using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Disputes.Commands.AdminResolveDispute;
using TutorHub.Application.Features.Disputes.Commands.CreateDispute;
using TutorHub.Application.Features.Disputes.Commands.UploadDisputeEvidence;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// F-30: grace-period (pre-release) dispute settlement on real Postgres —
/// EscrowHold, partial refund from Pending escrow, and F-04/F-22
/// anti-chaining enforcement inside SaveChangesAsync.
/// 12h-grace rule: post-release sessions are deemed accepted and cannot be disputed.
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
        session.TryStartGracePeriod(DateTime.UtcNow.AddHours(-2), TimeSpan.FromHours(12));
        await Db.SaveChangesAsync();

        return (admin.Id, studentUser.Id, session);
    }

    [Fact]
    public async Task GracePeriodDispute_PartialRefund_SettlesFromPendingEscrow()
    {
        // Arrange: session is inside its 12h grace window (pre-release, not paid out).
        var (adminId, studentUserId, session) = await SetupPaidSessionAsync();

        // Act: student disputes pre-release, admin grants partial refund of 100k on 300k gross.
        SetCurrentUser(studentUserId, UserRole.Student);
        var dispute = await SendAsync(new CreateDisputeCommand(
            SessionId: session.Id,
            Reason: DisputeReason.QualityIssue,
            Description: "The tutor ended the session 20 minutes early, verified by chat log."));

        dispute.HoldType.Should().Be(FinancialHoldType.EscrowHold);

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

        // Assert: StudentRefund(100k) from Pending escrow; tutor keeps 200k gross
        // (fee 20k, net 180k). No post-release fee-reversal transaction exists.
        var refund = await Db.Transactions.AsNoTracking().FirstAsync(t =>
            t.SessionId == session.Id && t.Type == TransactionType.StudentRefund);
        refund.Amount.Should().Be(100_000m);
        refund.Status.Should().Be(TransactionStatus.Succeeded);

        var reversals = await Db.Transactions.AsNoTracking().CountAsync(t =>
            t.SessionId == session.Id && t.Type == TransactionType.PlatformFeeReversal);
        reversals.Should().Be(0);

        var payoutTx = await Db.Transactions.AsNoTracking().FirstAsync(t =>
            t.SessionId == session.Id && t.Type == TransactionType.SessionPayoutCredit);
        payoutTx.Amount.Should().Be(200_000m);
        payoutTx.CommissionAmount.Should().Be(20_000m);
        payoutTx.PayoutAmount.Should().Be(180_000m);

        var enrollment = await Db.Enrollments.AsNoTracking().FirstAsync(e => e.BookingId == payoutTx.BookingId);
        var wallet = await Db.Wallets.AsNoTracking().FirstAsync(w => w.TutorProfileId == enrollment.TutorProfileId);
        // 1,000,000 seeded + 180,000 tutor net = 1,180,000.
        wallet.AvailableBalance.Should().Be(1_180_000m);
        wallet.HeldBalance.Should().Be(0m);

        var completed = await Db.Sessions.AsNoTracking().FirstAsync(s => s.Id == session.Id);
        completed.Status.Should().Be(SessionStatus.Completed);
        completed.IsPayoutReleased.Should().BeTrue();
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
