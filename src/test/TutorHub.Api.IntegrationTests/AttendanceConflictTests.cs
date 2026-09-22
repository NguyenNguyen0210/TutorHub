using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Application.Features.Sessions.SubmitAttendance;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// P0-F2: two-way attendance on real Postgres. A disagreement must be recorded as a
/// conflict and must NOT release the session's escrow — the money stays pending until
/// an admin resolves it, which is the whole point of the 2-way verification window.
/// </summary>
public class AttendanceConflictTests : IntegrationTestBase
{
    public AttendanceConflictTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task DisagreeingAttendance_FlagsConflictAndWithholdsPayout()
    {
        // Arrange
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
            .FirstAsync(s => s.Enrollment.BookingId == booking.Id && s.SessionNumber == 1);
        session.Schedule(DateTime.UtcNow.AddHours(-3), DateTime.UtcNow.AddHours(-2));
        await Db.SaveChangesAsync();

        // Act: the student says the session happened, the tutor says it did not.
        SetCurrentUser(studentUser.Id, UserRole.Student);
        await SendAsync(new SubmitAttendanceCommand(session.Id, AttendanceStatus.Attended));

        SetCurrentUser(tutor.UserId, UserRole.Tutor);
        var result = await SendAsync(new SubmitAttendanceCommand(session.Id, AttendanceStatus.Absent));

        // Assert
        result.Status.Should().NotBe(SessionStatus.Completed);
        result.HasAttendanceConflict.Should().BeTrue();

        var fresh = await Db.Sessions.AsNoTracking().FirstAsync(s => s.Id == session.Id);
        fresh.HasAttendanceConflict.Should().BeTrue();
        fresh.Status.Should().Be(SessionStatus.Scheduled);
        fresh.IsPayoutReleased.Should().BeFalse();

        var payoutReleased = await Db.Transactions.AsNoTracking().AnyAsync(t =>
            t.SessionId == session.Id && t.Type == TransactionType.SessionPayoutCredit);
        payoutReleased.Should().BeFalse("a conflicted session must not release escrow");

        var conflictEvents = await Db.OutboxMessages.AsNoTracking()
            .CountAsync(m => m.AggregateId == session.Id && m.EventType == "AttendanceConflictDetected");
        conflictEvents.Should().Be(1, "admins are notified through the outbox once per conflict");

        // A self-reported Absent is an admission of absence and earns a strike (Q1b).
        var absentSubmitter = await Db.Users.AsNoTracking().FirstAsync(u => u.Id == tutor.UserId);
        absentSubmitter.AbsentStrikes.Should().Be(1);
    }
}
