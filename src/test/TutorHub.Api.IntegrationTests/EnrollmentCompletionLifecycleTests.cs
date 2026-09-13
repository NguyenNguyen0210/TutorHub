using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Application.Features.Sessions.CancelSession;
using TutorHub.Application.Features.Sessions.SubmitAttendance;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// H2 regression: an Enrollment must complete once every Session is resolved,
/// even when one Session was cancelled (FR-ENR-005, FR-SESSION-007).
/// </summary>
public class EnrollmentCompletionLifecycleTests : IntegrationTestBase
{
    public EnrollmentCompletionLifecycleTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    private async Task<(Guid StudentUserId, Guid TutorUserId, Guid EnrollmentId, List<Session> Sessions)> SetupAsync()
    {
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

        var sessions = await Db.Sessions
            .Where(s => s.EnrollmentId == enrollment.Id)
            .OrderBy(s => s.SessionNumber)
            .ToListAsync();

        return (studentUser.Id, tutorUser.Id, enrollment.Id, sessions);
    }

    private async Task CompleteSessionAsync(Guid studentUserId, Guid tutorUserId, Guid sessionId)
    {
        var tracked = await Db.Sessions.FirstAsync(s => s.Id == sessionId);
        tracked.Schedule(DateTime.UtcNow.AddHours(-3), DateTime.UtcNow.AddHours(-2));
        await Db.SaveChangesAsync();

        SetCurrentUser(studentUserId, UserRole.Student);
        await SendAsync(new SubmitAttendanceCommand(sessionId, AttendanceStatus.Attended));
        SetCurrentUser(tutorUserId, UserRole.Tutor);
        await SendAsync(new SubmitAttendanceCommand(sessionId, AttendanceStatus.Attended));
    }

    [Fact]
    public async Task CancellingLastUnresolvedSession_AfterOthersCompleted_CompletesEnrollment()
    {
        var (studentUserId, tutorUserId, enrollmentId, sessions) = await SetupAsync();

        // Complete sessions 1 and 2.
        await CompleteSessionAsync(studentUserId, tutorUserId, sessions[0].Id);
        await CompleteSessionAsync(studentUserId, tutorUserId, sessions[1].Id);

        // Cancel the last unresolved session.
        SetCurrentUser(studentUserId, UserRole.Student);
        await SendAsync(new CancelSessionCommand(sessions[2].Id, "Cannot attend final session"));

        var enrollment = await Db.Enrollments.AsNoTracking().FirstAsync(e => e.Id == enrollmentId);
        enrollment.Status.Should().Be(EnrollmentStatus.Completed);
        enrollment.CompletedAt.Should().NotBeNull();
        enrollment.CompletedSessions.Should().Be(2);
    }

    [Fact]
    public async Task CancellingOneSession_LeavesEnrollmentActive_UntilRestResolved()
    {
        var (studentUserId, _, enrollmentId, sessions) = await SetupAsync();

        SetCurrentUser(studentUserId, UserRole.Student);
        await SendAsync(new CancelSessionCommand(sessions[0].Id, "Skip first session"));

        var enrollment = await Db.Enrollments.AsNoTracking().FirstAsync(e => e.Id == enrollmentId);
        enrollment.Status.Should().Be(EnrollmentStatus.Active);
        enrollment.CompletedAt.Should().BeNull();
    }
}
