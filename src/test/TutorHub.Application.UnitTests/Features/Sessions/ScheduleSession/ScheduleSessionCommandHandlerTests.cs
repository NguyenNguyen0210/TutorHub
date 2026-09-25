using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Features.Sessions.ScheduleSession;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using TutorHub.Infrastructure.Persistence;

namespace TutorHub.Application.UnitTests.Features.Sessions.ScheduleSession;

public class ScheduleSessionCommandHandlerTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly StubCurrentUserService _currentUserService = new();
    private readonly IConfiguration _configuration = new ConfigurationBuilder().Build();
    private readonly StubClock _clock;
    private readonly DateTime _fixedNow = new(2026, 9, 26, 10, 0, 0, DateTimeKind.Utc);

    public ScheduleSessionCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        _context = new AppDbContext(options);
        _clock = new StubClock(_fixedNow);
    }

    public void Dispose() => _context.Dispose();

    private ScheduleSessionCommandHandler CreateHandler() =>
        new(_context, _currentUserService, _configuration, _clock);

    private async Task<(Session session, Enrollment enrollment, User studentUser, User tutorUser)> SeedAggregateAsync(
        DateTime? preScheduleStart = null)
    {
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).WithStatus(AccountStatus.Active).Build();
        var tutorProfile = new TutorProfileBuilder().WithUser(tutorUser).Build();

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = Guid.NewGuid(),
            ServiceId = Guid.NewGuid(),
            TotalPrice = 1_000_000m,
            TotalSessions = 3,
            SessionDurationMinutes = 60,
            TeachingMode = TeachingMode.Online
        };
        enrollment.Activate();

        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            SessionNumber = 1,
            EarningAmount = 333_333m
        };
        if (preScheduleStart.HasValue)
        {
            session.Schedule(preScheduleStart.Value, preScheduleStart.Value.AddHours(1));
        }
        enrollment.Sessions.Add(session);

        _context.Enrollments.Add(enrollment);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();
        return (session, enrollment, studentUser, tutorUser);
    }

    [Fact]
    public async Task Handle_WhenStudentSchedulesUnscheduledSession_ThrowsForbiddenException()
    {
        var (session, _, studentUser, _) = await SeedAggregateAsync();
        _currentUserService.Set(studentUser.Id, UserRole.Student);
        var start = _fixedNow.AddDays(2);
        var command = new ScheduleSessionCommand(session.Id, start, start.AddHours(1));

        var act = () => CreateHandler().Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Handle_WhenTutorSchedulesInsideNoticeWindow_ThrowsBadRequestException()
    {
        var (session, _, _, tutorUser) = await SeedAggregateAsync();
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);
        var start = _fixedNow.AddHours(2);
        var command = new ScheduleSessionCommand(session.Id, start, start.AddHours(1));

        var act = () => CreateHandler().Handle(command, CancellationToken.None);

        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("24"));
    }

    [Fact]
    public async Task Handle_WhenTutorSchedulesUnscheduledSessionWithValidTime_SchedulesSession()
    {
        var (session, _, _, tutorUser) = await SeedAggregateAsync();
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);
        var start = _fixedNow.AddDays(2);
        var command = new ScheduleSessionCommand(session.Id, start, start.AddHours(1));

        var result = await CreateHandler().Handle(command, CancellationToken.None);

        result.Should().NotBeNull();
        result.Status.Should().Be(SessionStatus.Scheduled);
        result.StartAt.Should().Be(start);
        result.EndAt.Should().Be(start.AddHours(1));
        var reloaded = await _context.Sessions.FindAsync(session.Id);
        reloaded!.Status.Should().Be(SessionStatus.Scheduled);
        reloaded.StartAt.Should().Be(start);
    }

    [Fact]
    public async Task Handle_WhenTutorReschedulesScheduledSession_UpdatesTimesAndStaysScheduled()
    {
        var oldStart = _fixedNow.AddDays(2);
        var (session, _, _, tutorUser) = await SeedAggregateAsync(preScheduleStart: oldStart);
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);
        var newStart = _fixedNow.AddDays(3);
        var command = new ScheduleSessionCommand(session.Id, newStart, newStart.AddHours(1));

        var result = await CreateHandler().Handle(command, CancellationToken.None);

        result.Status.Should().Be(SessionStatus.Scheduled);
        result.StartAt.Should().Be(newStart);
        result.EndAt.Should().Be(newStart.AddHours(1));
        var reloaded = await _context.Sessions.FindAsync(session.Id);
        reloaded!.Status.Should().Be(SessionStatus.Scheduled);
        reloaded.StartAt.Should().Be(newStart);
    }

    [Fact]
    public async Task Handle_WhenNewTimeOverlapsOwnOtherSession_ThrowsConflictException()
    {
        var (session, enrollment, _, tutorUser) = await SeedAggregateAsync();
        var overlapStart = _fixedNow.AddDays(2).AddMinutes(30);
        var other = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = null!,
            SessionNumber = 2,
            EarningAmount = 333_333m
        };
        other.Schedule(overlapStart, overlapStart.AddHours(1));
        _context.Sessions.Add(other);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);
        var start = _fixedNow.AddDays(2);
        var command = new ScheduleSessionCommand(session.Id, start, start.AddHours(1));

        var act = () => CreateHandler().Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }
}
