using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
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

        // Schedule in the past at domain level (availability is handler-level concern).
        session.Schedule(DateTime.UtcNow.AddHours(-3), DateTime.UtcNow.AddHours(-2));
        await Db.SaveChangesAsync();

        return (admin.Id, studentUser.Id, session);
    }

    [Fact]
    public async Task PreRelease_StudentFullRefund_DebitsEscrowAndRecordsPendingRefund()
    {
        // Arrange
        var (adminId, studentUserId, session) = await SetupPaidSessionAsync();

        var dispute = await SendAsync(new CreateDisputeCommand(
            SessionId: session.Id,
            InitiatorUserId: studentUserId,
            Reason: DisputeReason.QualityIssue,
            Description: "The tutor did not attend the scheduled session at all."));

        dispute.HoldType.Should().Be(FinancialHoldType.EscrowHold);

        await SendAsync(new UploadDisputeEvidenceCommand(
            DisputeId: dispute.Id,
            UploadedByUserId: studentUserId,
            FileName: "chat-log.png",
            FileUrl: "disputes/chat-log.png",
            ContentType: "image/png",
            FileSizeBytes: 1024));

        // Act
        await SendAsync(new AdminResolveDisputeCommand(
            DisputeId: dispute.Id,
            AdminUserId: adminId,
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
        refundTx.Status.Should().Be(TransactionStatus.Pending);
    }

    [Fact]
    public async Task PreRelease_TutorWins_DebitsEscrowAndCreditsNet()
    {
        // Arrange
        var (adminId, studentUserId, session) = await SetupPaidSessionAsync();

        var dispute = await SendAsync(new CreateDisputeCommand(
            SessionId: session.Id,
            InitiatorUserId: studentUserId,
            Reason: DisputeReason.QualityIssue,
            Description: "The student claims tutor was late and session quality was bad."));

        dispute.HoldType.Should().Be(FinancialHoldType.EscrowHold);

        await SendAsync(new UploadDisputeEvidenceCommand(
            DisputeId: dispute.Id,
            UploadedByUserId: studentUserId,
            FileName: "notes.pdf",
            FileUrl: "disputes/notes.pdf",
            ContentType: "application/pdf",
            FileSizeBytes: 2048));

        // Act
        await SendAsync(new AdminResolveDisputeCommand(
            DisputeId: dispute.Id,
            AdminUserId: adminId,
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

        var dispute = await SendAsync(new CreateDisputeCommand(
            SessionId: session.Id,
            InitiatorUserId: studentUserId,
            Reason: DisputeReason.QualityIssue,
            Description: "Partial coverage of curriculum during the scheduled session."));

        dispute.HoldType.Should().Be(FinancialHoldType.EscrowHold);

        await SendAsync(new UploadDisputeEvidenceCommand(
            DisputeId: dispute.Id,
            UploadedByUserId: studentUserId,
            FileName: "screenshot.png",
            FileUrl: "disputes/screenshot.png",
            ContentType: "image/png",
            FileSizeBytes: 10_000));

        // Act
        await SendAsync(new AdminResolveDisputeCommand(
            DisputeId: dispute.Id,
            AdminUserId: adminId,
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
        refundTx.Status.Should().Be(TransactionStatus.Pending);

        var payoutTx = await Db.Transactions.AsNoTracking().FirstOrDefaultAsync(t =>
            t.SessionId == session.Id && t.Type == TransactionType.SessionPayoutCredit);
        payoutTx.Should().NotBeNull();
        payoutTx!.Amount.Should().Be(200_000m);
        payoutTx.CommissionAmount.Should().Be(20_000m);
        payoutTx.PayoutAmount.Should().Be(180_000m);

        (refundTx.Amount + payoutTx.PayoutAmount + payoutTx.CommissionAmount).Should().Be(300_000m);
    }

    [Fact]
    public async Task FastTrack_TutorClaims_DebitsEscrowAndCreditsNet()
    {
        // Arrange
        var (adminId, studentUserId, session) = await SetupPaidSessionAsync();
        var tutorUserId = session.Enrollment.TutorProfile.UserId;

        var now = DateTime.UtcNow;
        session.Schedule(now.AddDays(-7), now.AddDays(-6));
        await Db.SaveChangesAsync();

        var opened = session.TryOpenAttendanceVerificationWindow(now.AddDays(-5), TimeSpan.FromHours(24));
        opened.Should().BeTrue();
        await Db.SaveChangesAsync();

        await SendAsync(new SubmitAttendanceCommand(tutorUserId, session.Id, AttendanceStatus.Attended));

        var dispute = await SendAsync(new CreateDisputeCommand(
            SessionId: session.Id,
            InitiatorUserId: studentUserId,
            Reason: DisputeReason.Other,
            Description: "Student disputes session attendance verification by tutor."));

        await SendAsync(new UploadDisputeEvidenceCommand(
            DisputeId: dispute.Id,
            UploadedByUserId: studentUserId,
            FileName: "attendance.png",
            FileUrl: "disputes/attendance.png",
            ContentType: "image/png",
            FileSizeBytes: 1024));

        // Act
        var result = await SendAsync(new FastTrackResolveDisputeCommand(
            DisputeId: dispute.Id,
            AdminUserId: adminId,
            AdminNotes: "Fast-track resolution in favor of tutor due to student silence."));

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

        result.Status.Should().Be(DisputeStatus.Resolved);
        var freshDispute = await Db.Disputes.AsNoTracking().FirstAsync(d => d.Id == dispute.Id);
        freshDispute.Status.Should().Be(DisputeStatus.Resolved);
    }

    [Fact]
    public async Task FastTrack_StudentClaims_DebitsEscrowAndFullRefund()
    {
        // Arrange
        var (adminId, studentUserId, session) = await SetupPaidSessionAsync();

        var now = DateTime.UtcNow;
        session.Schedule(now.AddDays(-7), now.AddDays(-6));
        await Db.SaveChangesAsync();

        var opened = session.TryOpenAttendanceVerificationWindow(now.AddDays(-5), TimeSpan.FromHours(24));
        opened.Should().BeTrue();
        await Db.SaveChangesAsync();

        await SendAsync(new SubmitAttendanceCommand(studentUserId, session.Id, AttendanceStatus.Attended));

        var dispute = await SendAsync(new CreateDisputeCommand(
            SessionId: session.Id,
            InitiatorUserId: studentUserId,
            Reason: DisputeReason.Other,
            Description: "Student disputes session because tutor was silent and no-show."));

        await SendAsync(new UploadDisputeEvidenceCommand(
            DisputeId: dispute.Id,
            UploadedByUserId: studentUserId,
            FileName: "attendance.png",
            FileUrl: "disputes/attendance.png",
            ContentType: "image/png",
            FileSizeBytes: 1024));

        // Act
        var result = await SendAsync(new FastTrackResolveDisputeCommand(
            DisputeId: dispute.Id,
            AdminUserId: adminId,
            AdminNotes: "Fast-track resolution in favor of student due to tutor silence."));

        // Assert
        var wallet = await Db.Wallets.AsNoTracking().FirstAsync(w => w.TutorProfileId == session.Enrollment.TutorProfileId);
        wallet.PendingBalance.Should().Be(600_000m);
        wallet.AvailableBalance.Should().Be(1_000_000m);

        var refundTx = await Db.Transactions.AsNoTracking().FirstOrDefaultAsync(t =>
            t.SessionId == session.Id && t.Type == TransactionType.StudentRefund);
        refundTx.Should().NotBeNull();
        refundTx!.Amount.Should().Be(300_000m);
        refundTx.Status.Should().Be(TransactionStatus.Pending);

        var payoutTx = await Db.Transactions.AsNoTracking().FirstOrDefaultAsync(t =>
            t.SessionId == session.Id && t.Type == TransactionType.SessionPayoutCredit);
        payoutTx.Should().BeNull();

        result.Status.Should().Be(DisputeStatus.Resolved);
        var freshDispute = await Db.Disputes.AsNoTracking().FirstAsync(d => d.Id == dispute.Id);
        freshDispute.Status.Should().Be(DisputeStatus.Resolved);
    }
}
