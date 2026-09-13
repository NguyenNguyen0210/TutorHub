using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Application.Features.Sessions.SubmitAttendance;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// M4 regression: each participant may submit their attendance outcome exactly
/// once; a second submission is rejected (FR-ATT-001/002).
/// </summary>
public class SingleAttendanceSubmissionTests : IntegrationTestBase
{
    public SingleAttendanceSubmissionTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    private async Task<(Guid StudentUserId, Session Session)> SetupScheduledSessionAsync()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
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
        await Db.SaveChangesAsync();

        return (studentUser.Id, session);
    }

    [Fact]
    public async Task SubmittingAttendanceTwice_BySameSide_IsRejected()
    {
        var (studentUserId, session) = await SetupScheduledSessionAsync();

        await SendAsync(new SubmitAttendanceCommand(studentUserId, session.Id, AttendanceStatus.Attended));

        var act = () => SendAsync(new SubmitAttendanceCommand(studentUserId, session.Id, AttendanceStatus.Absent));

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task SubmittingAttendance_OncePerSide_IsAccepted()
    {
        var (studentUserId, session) = await SetupScheduledSessionAsync();
        var tutorUserId = (await Db.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile)
            .FirstAsync(s => s.Id == session.Id)).Enrollment.TutorProfile.UserId;

        await SendAsync(new SubmitAttendanceCommand(studentUserId, session.Id, AttendanceStatus.Attended));
        var result = await SendAsync(new SubmitAttendanceCommand(tutorUserId, session.Id, AttendanceStatus.Attended));

        result.Status.Should().Be(SessionStatus.Completed);
    }
}
