using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.BackgroundServices;

namespace TutorHub.Api.IntegrationTests;

public class AttendanceVerificationJobRecoveryTests : IntegrationTestBase
{
    public AttendanceVerificationJobRecoveryTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task ProcessAttendanceVerificationWindowsAsync_RecoversOrphanedSession_AndReleasesPayout()
    {
        // 1. Arrange: Setup paid enrollment with scheduled session
        var (tutorUser, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);

        SetCurrentUser(studentUser.Id, UserRole.Student);
        var dto = await SendAsync(new CreateBookingCommand(service.Id));

        var booking = await Db.Bookings
            .Include(b => b.StudentProfile)
            .Include(b => b.TutorProfile)
            .FirstAsync(b => b.Id == dto.Id);

        var activation = Scope.ServiceProvider.GetRequiredService<IEnrollmentActivationService>();
        var enrollment = await activation.ActivateAsync(booking, DateTime.UtcNow, CancellationToken.None);
        booking.Status = BookingStatus.Paid;
        await Db.SaveChangesAsync();

        var session = await Db.Sessions
            .Include(s => s.Enrollment)
            .FirstAsync(s => s.EnrollmentId == enrollment.Id && s.SessionNumber == 1);

        session.Schedule(DateTime.UtcNow.AddHours(-3), DateTime.UtcNow.AddHours(-2));

        // Simulate orphaned state: both submitted attended, but payout release did not run
        session.SubmitStudentAttendance(AttendanceStatus.Attended, DateTime.UtcNow.AddHours(-1));
        session.SubmitTutorAttendance(AttendanceStatus.Attended, DateTime.UtcNow.AddHours(-1));
        await Db.SaveChangesAsync();

        session.Status.Should().Be(SessionStatus.Scheduled);
        session.IsPayoutReleased.Should().BeFalse();
        session.CompletedAt.Should().BeNull();

        var initialWallet = await Db.Wallets.AsNoTracking().FirstAsync(w => w.TutorProfileId == tutor.Id);
        var initialPending = initialWallet.PendingBalance;
        var initialAvailable = initialWallet.AvailableBalance;

        // 2. Act: Run AttendanceVerificationJob recovery
        var scopeFactory = Scope.ServiceProvider.GetRequiredService<IServiceScopeFactory>();
        var clock = Scope.ServiceProvider.GetRequiredService<IClock>();
        var job = new AttendanceVerificationJob(scopeFactory, NullLogger<AttendanceVerificationJob>.Instance, clock);

        var recoveredCount = await job.ProcessAttendanceVerificationWindowsAsync(CancellationToken.None);

        // 3. Assert
        recoveredCount.Should().BeGreaterThanOrEqualTo(1);

        var reloadedSession = await Db.Sessions.AsNoTracking().FirstAsync(s => s.Id == session.Id);
        reloadedSession.Status.Should().Be(SessionStatus.Completed);
        reloadedSession.IsPayoutReleased.Should().BeTrue();
        reloadedSession.CompletedAt.Should().NotBeNull();

        var updatedWallet = await Db.Wallets.AsNoTracking().FirstAsync(w => w.TutorProfileId == tutor.Id);
        updatedWallet.PendingBalance.Should().BeLessThan(initialPending);
        updatedWallet.AvailableBalance.Should().BeGreaterThan(initialAvailable);

        var payoutTx = await Db.Transactions.AsNoTracking()
            .FirstOrDefaultAsync(t => t.SessionId == session.Id && t.Type == TransactionType.SessionPayoutCredit);
        payoutTx.Should().NotBeNull();
        payoutTx!.PayoutAmount.Should().BeGreaterThan(0);
    }
}
