using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Application.Features.Disputes.Commands.AdminResolveDispute;
using TutorHub.Application.Features.Reviews.CreateEnrollmentReview;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class AggregateConcurrencyTests : IntegrationTestBase
{
    public AggregateConcurrencyTests(IntegrationWebApplicationFactory factory) : base(factory) { }

    [Fact]
    public async Task TwoDisputeResolutions_OnDifferentSessions_PreserveProgressAndMoney()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        service.TotalSessions = 2; service.Price = 200_000; await Db.SaveChangesAsync();
        SetCurrentUser(studentUser.Id, UserRole.Student);
        var purchase = await SendAsync(new CreateBookingCommand(service.Id));
        var booking = await Db.Bookings.Include(b => b.StudentProfile).Include(b => b.TutorProfile).SingleAsync(b => b.Id == purchase.Id);
        var enrollment = await Scope.ServiceProvider.GetRequiredService<IEnrollmentActivationService>().ActivateAsync(booking, DateTime.UtcNow, CancellationToken.None);
        booking.Status = BookingStatus.Paid;
        var now = DateTime.UtcNow; var disputes = new List<Dispute>();
        foreach (var session in enrollment.Sessions)
        {
            session.Schedule(now.AddHours(-3), now.AddHours(-2));
            session.TryStartGracePeriod(now.AddHours(-2), TimeSpan.FromHours(12));
            session.ReportIssue(studentUser.Id, "Other", "Concurrent dispute review", now);
            var dispute = new Dispute { Id = Guid.NewGuid(), SessionId = session.Id, InitiatorUserId = studentUser.Id,
                RespondentUserId = tutor.UserId, Reason = DisputeReason.Other, Description = "Concurrent dispute review" };
            dispute.SetFinancialHold(session.SessionPrice, FinancialHoldType.EscrowHold, FinancialHoldStatus.Active, now);
            dispute.Evidences.Add(new DisputeEvidence { Id = Guid.NewGuid(), DisputeId = dispute.Id, UploadedByUserId = studentUser.Id,
                FileName = "test.pdf", FileUrl = "managed-test", ContentType = "application/pdf", FileSizeBytes = 100 });
            Db.Disputes.Add(dispute); disputes.Add(dispute);
        }
        await Db.SaveChangesAsync(); Db.ChangeTracker.Clear();
        SetCurrentUser(admin.Id, UserRole.Admin);
        await Task.WhenAll(disputes.Select(d => SendAsync(new AdminResolveDisputeCommand(d.Id,
            DisputeResolutionDecision.TutorWinsReleaseEarning, null, "Reviewed the session evidence."))));
        var final = await Db.Enrollments.AsNoTracking().Include(e => e.Sessions).SingleAsync(e => e.Id == enrollment.Id);
        Assert.Equal(EnrollmentStatus.Completed, final.Status);
        Assert.Equal(2, final.CompletedSessions);
        Assert.All(final.Sessions, s => Assert.True(s.IsPayoutReleased));
        var wallet = await Db.Wallets.AsNoTracking().SingleAsync(w => w.TutorProfileId == tutor.Id);
        Assert.Equal(0m, wallet.PendingBalance); Assert.Equal(1_180_000m, wallet.AvailableBalance);
        Assert.Equal(2, await Db.Transactions.CountAsync(t => t.BookingId == booking.Id && t.Type == TransactionType.SessionPayoutCredit));
    }

    [Fact]
    public async Task ConcurrentReviews_OnDifferentContracts_RecomputeSameTutorAggregate()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        service.TotalSessions = 1; await Db.SaveChangesAsync();
        SetCurrentUser(studentUser.Id, UserRole.Student);
        var ids = new List<Guid>();
        for (int index = 0; index < 2; index++)
        {
            var purchase = await SendAsync(new CreateBookingCommand(service.Id));
            var booking = await Db.Bookings.Include(b => b.StudentProfile).Include(b => b.TutorProfile).SingleAsync(b => b.Id == purchase.Id);
            var enrollment = await Scope.ServiceProvider.GetRequiredService<IEnrollmentActivationService>().ActivateAsync(booking, DateTime.UtcNow, CancellationToken.None);
            booking.Status = BookingStatus.Paid;
            var session = enrollment.Sessions.Single();
            session.Schedule(DateTime.UtcNow.AddDays(-2), DateTime.UtcNow.AddDays(-2).AddHours(1));
            session.Complete(); enrollment.RecordCompletedSession(session.Id);
            await Db.SaveChangesAsync(); ids.Add(enrollment.Id);
        }
        Db.ChangeTracker.Clear();
        await Task.WhenAll(SendAsync(new CreateEnrollmentReviewCommand(ids[0], 2, "Clear explanations, room for improvement.")),
            SendAsync(new CreateEnrollmentReviewCommand(ids[1], 4, "Good learning experience overall.")));
        var final = await Db.TutorProfiles.AsNoTracking().SingleAsync(t => t.Id == tutor.Id);
        Assert.Equal(2, final.TotalReviews); Assert.Equal(3m, final.RatingAvg);
    }
}
