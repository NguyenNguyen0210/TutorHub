using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Application.Features.Sessions.SubmitAttendance;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// C2 regression: activation must credit the GROSS escrow amount and every
/// allocated session must release its net payout without exhausting escrow.
/// </summary>
public class EnrollmentActivationServiceTests : IntegrationTestBase
{
    public EnrollmentActivationServiceTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task ActivateAsync_HoldsGrossEscrow_AndAllSessionsRelease()
    {
        // Arrange: wallet available seeded 1,000,000; service price 900,000 / 3 sessions.
        var (tutorUser, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);

        SetCurrentUser(studentUser.Id, UserRole.Student);

        var bookingDto = await SendAsync(new CreateBookingCommand(service.Id));

        var booking = await Db.Bookings
            .Include(b => b.StudentProfile)
            .Include(b => b.TutorProfile)
            .Include(b => b.Subject)
            .FirstAsync(b => b.Id == bookingDto.Id);

        var activation = Scope.ServiceProvider.GetRequiredService<IEnrollmentActivationService>();

        // Act: activate (mirrors the corrected IPN path).
        var enrollment = await activation.ActivateAsync(booking, DateTime.UtcNow, CancellationToken.None);
        await Db.SaveChangesAsync();

        // Assert: GROSS escrow credited (900,000), not net (810,000).
        var wallet = await Db.Wallets.AsNoTracking().FirstAsync(w => w.TutorProfileId == tutor.Id);
        wallet.PendingBalance.Should().Be(900_000m);
        wallet.AvailableBalance.Should().Be(1_000_000m);

        var sessions = await Db.Sessions.AsNoTracking()
            .Where(s => s.EnrollmentId == enrollment.Id)
            .OrderBy(s => s.SessionNumber)
            .ToListAsync();
        sessions.Should().HaveCount(3);
        sessions.Sum(s => s.EarningAmount).Should().Be(900_000m);

        // Act: schedule + dual-attend every session -> all payouts release.
        foreach (var s in sessions)
        {
            var tracked = await Db.Sessions.Include(x => x.Enrollment).FirstAsync(x => x.Id == s.Id);
            tracked.Schedule(DateTime.UtcNow.AddHours(-3), DateTime.UtcNow.AddHours(-2));
            await Db.SaveChangesAsync();

            SetCurrentUser(studentUser.Id, UserRole.Student);
            await SendAsync(new SubmitAttendanceCommand(tracked.Id, AttendanceStatus.Attended));
            SetCurrentUser(tutorUser.Id, UserRole.Tutor);
            await SendAsync(new SubmitAttendanceCommand(tracked.Id, AttendanceStatus.Attended));
        }

        // Assert: escrow fully drained; net credited (1,000,000 + 3 * 270,000).
        var finalWallet = await Db.Wallets.AsNoTracking().FirstAsync(w => w.TutorProfileId == tutor.Id);
        finalWallet.PendingBalance.Should().Be(0m);
        finalWallet.AvailableBalance.Should().Be(1_810_000m);

        var enrollmentFresh = await Db.Enrollments.AsNoTracking().FirstAsync(e => e.Id == enrollment.Id);
        enrollmentFresh.Status.Should().Be(EnrollmentStatus.Completed);
    }
}
