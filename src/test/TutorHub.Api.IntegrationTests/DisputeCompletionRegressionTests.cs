using Microsoft.EntityFrameworkCore;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Disputes.Commands.AdminResolveDispute;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.Persistence;
using TutorHub.Infrastructure.Services;
using Xunit;

namespace TutorHub.Api.IntegrationTests;

public class DisputeCompletionRegressionTests : IntegrationTestBase
{
    public DisputeCompletionRegressionTests(IntegrationWebApplicationFactory factory) : base(factory) { }
    [Theory]
    [InlineData(DisputeResolutionDecision.TutorWinsReleaseEarning)]
    [InlineData(DisputeResolutionDecision.StudentWinsFullRefund)]
    [InlineData(DisputeResolutionDecision.StudentWinsPartialRefund)]
    public async Task LastDisputeResolution_CompletesFullyResolvedEnrollment(DisputeResolutionDecision decision)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(IntegrationWebApplicationFactory.IntegrationConnectionString).Options;
        var seed = Db;
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(seed);
        var (studentUser, student, service) = await SeedHelper.SeedMarketplaceAsync(seed, tutor, admin.Id);
        var now = DateTime.UtcNow;
        var booking = new Booking { Id = Guid.NewGuid(), StudentProfileId = student.Id, TutorProfileId = tutor.Id, SubjectId = service.SubjectId, ServiceId = service.Id, TotalPrice = 200_000, TotalSessions = 2, SessionDurationMinutes = 60, Status = BookingStatus.Paid, CreatedAt = now };
        var enrollment = new Enrollment { Id = Guid.NewGuid(), BookingId = booking.Id, Booking = booking, StudentProfileId = student.Id, TutorProfileId = tutor.Id, SubjectId = service.SubjectId, ServiceId = service.Id, TotalPrice = 200_000, TotalSessions = 2, SessionDurationMinutes = 60, PlatformFeeRate = 0.1m, CreatedAt = now };
        enrollment.Activate();
        var first = new Session { Id = Guid.NewGuid(), EnrollmentId = enrollment.Id, SessionNumber = 1, SessionPrice = 100_000 };
        first.Schedule(now.AddDays(-2), now.AddDays(-2).AddHours(1)); first.Complete(now.AddDays(-2).AddHours(14));
        var last = new Session { Id = Guid.NewGuid(), EnrollmentId = enrollment.Id, SessionNumber = 2, SessionPrice = 100_000 };
        last.Schedule(now.AddHours(-3), now.AddHours(-2)); last.TryStartGracePeriod(now.AddHours(-2), TimeSpan.FromHours(12));
        last.ReportIssue(studentUser.Id, "Other", "Audit issue", now.AddHours(-1));
        enrollment.Sessions.Add(first); enrollment.Sessions.Add(last); enrollment.RecordCompletedSession(first.Id);
        seed.Enrollments.Add(enrollment);
        var dispute = new Dispute { Id = Guid.NewGuid(), SessionId = last.Id, InitiatorUserId = studentUser.Id, RespondentUserId = tutor.UserId, Reason = DisputeReason.Other, Description = "Audit issue", CreatedAt = now };
        dispute.SetFinancialHold(100_000, FinancialHoldType.EscrowHold, FinancialHoldStatus.Active, now);
        dispute.Evidences.Add(new DisputeEvidence { Id = Guid.NewGuid(), DisputeId = dispute.Id, UploadedByUserId = studentUser.Id, FileName = "audit.pdf", FileUrl = "audit-evidence", ContentType = "application/pdf", FileSizeBytes = 100, CreatedAt = now });
        seed.Disputes.Add(dispute);
        var wallet = await seed.Wallets.SingleAsync(w => w.TutorProfileId == tutor.Id); wallet.CreditPending(100_000, now);
        await seed.SaveChangesAsync();

        await using var requestContext = new AppDbContext(options);
        var user = new TestCurrentUserService();
        user.Set(admin.Id, UserRole.Admin);
        var handler = new AdminResolveDisputeCommandHandler(requestContext, new SystemClock(), new Mock<IAuditLogService>().Object, user, new TutorHub.Application.Features.StudentWallets.Services.StudentWalletService(requestContext));
        await handler.Handle(new AdminResolveDisputeCommand(dispute.Id, decision, decision == DisputeResolutionDecision.StudentWinsPartialRefund ? 50_000m : null, "Audit resolution"), CancellationToken.None);

        await using var verify = new AppDbContext(options);
        var persisted = await verify.Enrollments.Include(e => e.Sessions).SingleAsync(e => e.Id == enrollment.Id);
        Assert.All(persisted.Sessions, s => Assert.Equal(SessionStatus.Completed, s.Status));
        Assert.Equal(EnrollmentStatus.Completed, persisted.Status);
        Assert.Equal(2, persisted.CompletedSessions);
    }
}
