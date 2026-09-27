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

public class PreReleaseDisputeResolutionTests : IntegrationTestBase
{
    public PreReleaseDisputeResolutionTests(IntegrationWebApplicationFactory factory)
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

        // Schedule in the past at domain level and transition to AwaitingPayout (grace period).
        session.Schedule(DateTime.UtcNow.AddHours(-3), DateTime.UtcNow.AddHours(-2));
        session.TryStartGracePeriod(DateTime.UtcNow, TimeSpan.FromHours(12));
        await Db.SaveChangesAsync();

        return (admin.Id, studentUser.Id, session);
    }

    [Fact]
    public async Task PreRelease_StudentFullRefund_DebitsEscrowAndRecordsPendingRefund()
    {
        // Arrange
        var (adminId, studentUserId, session) = await SetupPaidSessionAsync();

        SetCurrentUser(studentUserId, UserRole.Student);
        var dispute = await SendAsync(new CreateDisputeCommand(
            SessionId: session.Id,
            Reason: DisputeReason.QualityIssue,
            Description: "The tutor did not attend the scheduled session at all."));

        dispute.HoldType.Should().Be(FinancialHoldType.EscrowHold);

        await SendAsync(new UploadDisputeEvidenceCommand(
            DisputeId: dispute.Id,
            FileName: "chat-log.png",
            FileUrl: "disputes/chat-log.png",
            ContentType: "image/png",
            FileSizeBytes: 1024));

        // Act
        SetCurrentUser(adminId, UserRole.Admin);
        await SendAsync(new AdminResolveDisputeCommand(
            DisputeId: dispute.Id,
            Decision: DisputeResolutionDecision.StudentWinsFullRefund,
            CustomRefundAmount: null,
            AdminNotes: "Full refund granted to student."));

        // Assert
        var wallet = await Db.Wallets.AsNoTracking().FirstAsync(w => w.TutorProfileId == session.Enrollment.TutorProfileId);
        wallet.PendingBalance.Should().Be(600_000m);
        wallet.AvailableBalance.Should().Be(1_000_000m);

        var refundTx = await Db.Transactions.AsNoTracking().FirstOrDefaultAsync(t =>
            t.SessionId == session.Id && t.Type == TransactionType.StudentRefund);
        refundTx.Should().NotBeNull();
        refundTx!.Amount.Should().Be(300_000m);
        refundTx.Status.Should().Be(TransactionStatus.Succeeded);
    }

    [Fact]
    public async Task PreRelease_TutorWins_DebitsEscrowAndCreditsNet()
    {
        // Arrange
        var (adminId, studentUserId, session) = await SetupPaidSessionAsync();

        SetCurrentUser(studentUserId, UserRole.Student);
        var dispute = await SendAsync(new CreateDisputeCommand(
            SessionId: session.Id,
            Reason: DisputeReason.QualityIssue,
            Description: "The student claims tutor was late and session quality was bad."));

        dispute.HoldType.Should().Be(FinancialHoldType.EscrowHold);

        await SendAsync(new UploadDisputeEvidenceCommand(
            DisputeId: dispute.Id,
            FileName: "notes.pdf",
            FileUrl: "disputes/notes.pdf",
            ContentType: "application/pdf",
            FileSizeBytes: 2048));

        // Act
        SetCurrentUser(adminId, UserRole.Admin);
        await SendAsync(new AdminResolveDisputeCommand(
            DisputeId: dispute.Id,
            Decision: DisputeResolutionDecision.TutorWinsReleaseEarning,
            CustomRefundAmount: null,
            AdminNotes: "Tutor fulfilled all requirements; full earning released."));

        // Assert
        var wallet = await Db.Wallets.AsNoTracking().FirstAsync(w => w.TutorProfileId == session.Enrollment.TutorProfileId);
        wallet.PendingBalance.Should().Be(600_000m);
        wallet.AvailableBalance.Should().Be(1_270_000m);

        var payoutTx = await Db.Transactions.AsNoTracking().FirstOrDefaultAsync(t =>
            t.SessionId == session.Id && t.Type == TransactionType.SessionPayoutCredit);
        payoutTx.Should().NotBeNull();
        payoutTx!.Amount.Should().Be(300_000m);
        payoutTx.CommissionAmount.Should().Be(30_000m);
        payoutTx.PayoutAmount.Should().Be(270_000m);
    }

    [Fact]
    public async Task PreRelease_PartialRefund_ConservesMoney()
    {
        // Arrange
        var (adminId, studentUserId, session) = await SetupPaidSessionAsync();

        SetCurrentUser(studentUserId, UserRole.Student);
        var dispute = await SendAsync(new CreateDisputeCommand(
            SessionId: session.Id,
            Reason: DisputeReason.QualityIssue,
            Description: "Partial coverage of curriculum during the scheduled session."));

        dispute.HoldType.Should().Be(FinancialHoldType.EscrowHold);

        await SendAsync(new UploadDisputeEvidenceCommand(
            DisputeId: dispute.Id,
            FileName: "screenshot.png",
            FileUrl: "disputes/screenshot.png",
            ContentType: "image/png",
            FileSizeBytes: 10_000));

        // Act
        SetCurrentUser(adminId, UserRole.Admin);
        await SendAsync(new AdminResolveDisputeCommand(
            DisputeId: dispute.Id,
            Decision: DisputeResolutionDecision.StudentWinsPartialRefund,
            CustomRefundAmount: 100_000m,
            AdminNotes: "Partial refund granted based on submitted evidence."));

        // Assert
        var wallet = await Db.Wallets.AsNoTracking().FirstAsync(w => w.TutorProfileId == session.Enrollment.TutorProfileId);
        wallet.PendingBalance.Should().Be(600_000m);
        wallet.AvailableBalance.Should().Be(1_180_000m);

        var refundTx = await Db.Transactions.AsNoTracking().FirstOrDefaultAsync(t =>
            t.SessionId == session.Id && t.Type == TransactionType.StudentRefund);
        refundTx.Should().NotBeNull();
        refundTx!.Amount.Should().Be(100_000m);
        refundTx.Status.Should().Be(TransactionStatus.Succeeded);

        var payoutTx = await Db.Transactions.AsNoTracking().FirstOrDefaultAsync(t =>
            t.SessionId == session.Id && t.Type == TransactionType.SessionPayoutCredit);
        payoutTx.Should().NotBeNull();
        payoutTx!.Amount.Should().Be(200_000m);
        payoutTx.CommissionAmount.Should().Be(20_000m);
        payoutTx.PayoutAmount.Should().Be(180_000m);

        (refundTx.Amount + payoutTx.PayoutAmount + payoutTx.CommissionAmount).Should().Be(300_000m);
    }
}
