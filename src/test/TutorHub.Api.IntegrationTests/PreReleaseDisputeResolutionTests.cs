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
    [Fact]
    public async Task AllocationPreview_IsReadOnly_UsesSnapshotFee_AndHttpResolutionReplaysSafely()
    {
        var (adminId, studentId, session) = await SetupPaidSessionAsync();
        SetCurrentUser(studentId, UserRole.Student);
        var dispute = await SendAsync(new CreateDisputeCommand(session.Id, DisputeReason.QualityIssue, "Original report for allocation review."));
        SetCurrentUser(adminId, UserRole.Admin);
        await SendAsync(new TutorHub.Application.Features.Disputes.Commands.AdminMoveDisputeUnderReview.AdminMoveDisputeUnderReviewCommand(dispute.Id));
        var blocked = await SendAsync(new TutorHub.Application.Features.Disputes.Queries.AdminGetDisputeInvestigation.AdminPreviewDisputeQuery(dispute.Id, DisputeResolutionDecision.StudentWinsFullRefund));
        blocked.CanResolve.Should().BeFalse();
        SetCurrentUser(studentId, UserRole.Student);
        await SendAsync(new UploadDisputeEvidenceCommand(dispute.Id, "evidence.png", new MemoryStream(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0x0D }), 12));
        SetCurrentUser(adminId, UserRole.Admin);
        var before = await Db.Transactions.CountAsync();
        var preview = await SendAsync(new TutorHub.Application.Features.Disputes.Queries.AdminGetDisputeInvestigation.AdminPreviewDisputeQuery(dispute.Id, DisputeResolutionDecision.StudentWinsPartialRefund, 12345.67m));
        preview.CanResolve.Should().BeTrue();
        (preview.StudentRefund + preview.TutorNet + preview.PlatformFee).Should().Be(session.SessionPrice);
        preview.PlatformFee.Should().Be(Math.Round((session.SessionPrice - 12345.67m) * session.Enrollment.PlatformFeeRate, 2, MidpointRounding.AwayFromZero));
        (await Db.Transactions.CountAsync()).Should().Be(before);
        var list = await SendAsync(new TutorHub.Application.Features.Disputes.Queries.AdminGetDisputes.AdminGetDisputesQuery(Search: dispute.Id.ToString()));
        list.Items.Should().ContainSingle(d => d.Id == dispute.Id && d.ServiceTitle != "");
        var admin = await Db.Users.SingleAsync(u => u.Id == adminId);
        using var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", Scope.ServiceProvider.GetRequiredService<TutorHub.Application.Common.Security.IJwtService>().GenerateAccessToken(admin));
        var payload = new { decision = "StudentWinsPartialRefund", customRefundAmount = 12345.67m, adminNotes = "Reviewed all evidence and allocated tuition." };
        using var missingKey = await System.Net.Http.Json.HttpClientJsonExtensions.PostAsJsonAsync(client, $"/api/v1/admin/disputes/{dispute.Id}/resolve", payload);
        missingKey.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
        client.DefaultRequestHeaders.Add("Idempotency-Key", Guid.NewGuid().ToString());
        using var first = await System.Net.Http.Json.HttpClientJsonExtensions.PostAsJsonAsync(client, $"/api/v1/admin/disputes/{dispute.Id}/resolve", payload);
        first.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        using var replay = await System.Net.Http.Json.HttpClientJsonExtensions.PostAsJsonAsync(client, $"/api/v1/admin/disputes/{dispute.Id}/resolve", payload);
        replay.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        (await replay.Content.ReadAsStringAsync()).Should().Be(await first.Content.ReadAsStringAsync());
        (await Db.Transactions.CountAsync(t => t.DisputeId == dispute.Id && t.Type == TransactionType.StudentRefund)).Should().Be(1);
        var after = await SendAsync(new TutorHub.Application.Features.Disputes.Queries.AdminGetDisputeInvestigation.AdminPreviewDisputeQuery(dispute.Id, DisputeResolutionDecision.StudentWinsFullRefund));
        after.CanResolve.Should().BeFalse();
    }

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
            Content: new MemoryStream(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D }),
            FileSizeBytes: 12));

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
            FileName: "notes.png",
            Content: new MemoryStream(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D }),
            FileSizeBytes: 12));

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
        payoutTx.PlatformFeeAmount.Should().Be(30_000m);
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
            Content: new MemoryStream(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D }),
            FileSizeBytes: 12));

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
        payoutTx.PlatformFeeAmount.Should().Be(20_000m);
        payoutTx.PayoutAmount.Should().Be(180_000m);

        (refundTx.Amount + payoutTx.PayoutAmount + payoutTx.PlatformFeeAmount).Should().Be(300_000m);
    }
}
