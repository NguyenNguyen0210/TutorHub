using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Features.Sessions.ScheduleSessionsBatch;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using TutorHub.Infrastructure.Persistence;

namespace TutorHub.Application.UnitTests.Features.Sessions.ScheduleSessionsBatch;

public class ScheduleSessionsBatchHandlerTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly StubCurrentUserService _currentUserService = new();
    private readonly IConfiguration _configuration = new ConfigurationBuilder().Build();
    private readonly StubClock _clock;
    private readonly DateTime _fixedNow = new(2026, 9, 26, 10, 0, 0, DateTimeKind.Utc);

    public ScheduleSessionsBatchHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        _context = new AppDbContext(options);
        _clock = new StubClock(_fixedNow);
    }

    public void Dispose() => _context.Dispose();

    private ScheduleSessionsBatchHandler CreateHandler() =>
        new(_context, _currentUserService, _configuration, _clock);

    private async Task<(Session s1, Session s2, Enrollment enrollment, User studentUser, User tutorUser)> SeedAggregateAsync()
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

        var s1 = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            SessionNumber = 1,
            EarningAmount = 333_333m
        };
        var s2 = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            SessionNumber = 2,
            EarningAmount = 333_333m
        };
        enrollment.Sessions.Add(s1);
        enrollment.Sessions.Add(s2);

        _context.Enrollments.Add(enrollment);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();
        return (s1, s2, enrollment, studentUser, tutorUser);
    }

    private async Task<Guid> SeedScheduledSessionForEnrollmentAsync(Enrollment enrollment, DateTime startAt)
    {
        var scheduled = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = null!,
            SessionNumber = 99,
            EarningAmount = 0m
        };
        scheduled.Schedule(startAt, startAt.AddHours(1));
        _context.Sessions.Add(scheduled);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();
        return scheduled.Id;
    }

    private async Task<Guid> SeedOtherTutorWithScheduledSessionAsync(DateTime startAt)
    {
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };
        var otherTutorUser = new UserBuilder().WithRole(UserRole.Tutor).WithStatus(AccountStatus.Active).Build();
        var otherTutorProfile = new TutorProfileBuilder().WithUser(otherTutorUser).Build();

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = otherTutorProfile.Id,
            TutorProfile = otherTutorProfile,
            SubjectId = Guid.NewGuid(),
            ServiceId = Guid.NewGuid(),
            TotalPrice = 1_000_000m,
            TotalSessions = 1,
            SessionDurationMinutes = 60,
            TeachingMode = TeachingMode.Online
        };
        enrollment.Activate();
        _context.Enrollments.Add(enrollment);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        return await SeedScheduledSessionForEnrollmentAsync(enrollment, startAt);
    }

    [Fact]
    public async Task Handle_WhenTwoValidItems_SchedulesBoth()
    {
        var (s1, s2, _, _, tutorUser) = await SeedAggregateAsync();
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);
        var start1 = _fixedNow.AddDays(2);
        var start2 = _fixedNow.AddDays(3);
        var command = new ScheduleSessionsBatchCommand(new List<SessionScheduleItem>
        {
            new(s1.Id, start1, start1.AddHours(1)),
            new(s2.Id, start2, start2.AddHours(1))
        });

        var result = await CreateHandler().Handle(command, CancellationToken.None);

        result.Should().HaveCount(2);
        result.Should().OnlyContain(d => d.Status == SessionStatus.Scheduled);
        (await _context.Sessions.FindAsync(s1.Id))!.Status.Should().Be(SessionStatus.Scheduled);
        (await _context.Sessions.FindAsync(s2.Id))!.Status.Should().Be(SessionStatus.Scheduled);
    }

    [Fact]
    public async Task Handle_WhenSecondItemViolatesNotice_FirstItemStaysUnscheduled()
    {
        var (s1, s2, _, _, tutorUser) = await SeedAggregateAsync();
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);
        var start1 = _fixedNow.AddDays(2);
        var badStart = _fixedNow.AddHours(2);
        var command = new ScheduleSessionsBatchCommand(new List<SessionScheduleItem>
        {
            new(s1.Id, start1, start1.AddHours(1)),
            new(s2.Id, badStart, badStart.AddHours(1))
        });

        var act = () => CreateHandler().Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<BadRequestException>();
        (await _context.Sessions.FindAsync(s1.Id))!.Status.Should().Be(SessionStatus.Unscheduled);
        (await _context.Sessions.FindAsync(s2.Id))!.Status.Should().Be(SessionStatus.Unscheduled);
    }

    [Fact]
    public async Task Handle_WhenCallerIsNotTutor_ThrowsForbiddenException()
    {
        var (s1, s2, _, studentUser, _) = await SeedAggregateAsync();
        _currentUserService.Set(studentUser.Id, UserRole.Student);
        var start1 = _fixedNow.AddDays(2);
        var start2 = _fixedNow.AddDays(3);
        var command = new ScheduleSessionsBatchCommand(new List<SessionScheduleItem>
        {
            new(s1.Id, start1, start1.AddHours(1)),
            new(s2.Id, start2, start2.AddHours(1))
        });

        var act = () => CreateHandler().Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Handle_WhenItemsOverlapEachOther_ThrowsConflictAndPersistsNothing()
    {
        var (s1, s2, _, _, tutorUser) = await SeedAggregateAsync();
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);
        var start1 = _fixedNow.AddDays(2);
        var start2 = start1.AddMinutes(30);
        var command = new ScheduleSessionsBatchCommand(new List<SessionScheduleItem>
        {
            new(s1.Id, start1, start1.AddHours(1)),
            new(s2.Id, start2, start2.AddHours(1))
        });

        var act = () => CreateHandler().Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
        (await _context.Sessions.FindAsync(s1.Id))!.Status.Should().Be(SessionStatus.Unscheduled);
        (await _context.Sessions.FindAsync(s2.Id))!.Status.Should().Be(SessionStatus.Unscheduled);
    }

    [Fact]
    public async Task Handle_WhenBatchOverlapsExistingScheduledSessionOfSameTutor_ThrowsConflictAndPersistsNothing()
    {
        var (s1, s2, enrollment, _, tutorUser) = await SeedAggregateAsync();
        var ownStart = _fixedNow.AddDays(2);
        await SeedScheduledSessionForEnrollmentAsync(enrollment, ownStart.AddMinutes(30));
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);
        var command = new ScheduleSessionsBatchCommand(new List<SessionScheduleItem>
        {
            new(s1.Id, ownStart, ownStart.AddHours(1)),
            new(s2.Id, _fixedNow.AddDays(3), _fixedNow.AddDays(3).AddHours(1))
        });

        var act = () => CreateHandler().Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
        (await _context.Sessions.FindAsync(s1.Id))!.Status.Should().Be(SessionStatus.Unscheduled);
        (await _context.Sessions.FindAsync(s2.Id))!.Status.Should().Be(SessionStatus.Unscheduled);
    }

    [Fact]
    public async Task Handle_WhenBatchOverlapsDifferentTutorsScheduledSession_SchedulesBatch()
    {
        var (s1, s2, _, _, tutorUser) = await SeedAggregateAsync();
        var start = _fixedNow.AddDays(2);
        await SeedOtherTutorWithScheduledSessionAsync(start.AddMinutes(30));
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);
        var command = new ScheduleSessionsBatchCommand(new List<SessionScheduleItem>
        {
            new(s1.Id, start, start.AddHours(1)),
            new(s2.Id, _fixedNow.AddDays(3), _fixedNow.AddDays(3).AddHours(1))
        });

        var result = await CreateHandler().Handle(command, CancellationToken.None);

        result.Should().HaveCount(2);
        (await _context.Sessions.FindAsync(s1.Id))!.Status.Should().Be(SessionStatus.Scheduled);
        (await _context.Sessions.FindAsync(s2.Id))!.Status.Should().Be(SessionStatus.Scheduled);
    }

    [Fact]
    public async Task Handle_WhenSessionIdUnknown_ThrowsNotFoundException()
    {
        var (_, _, _, _, tutorUser) = await SeedAggregateAsync();
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);
        var start = _fixedNow.AddDays(2);
        var command = new ScheduleSessionsBatchCommand(new List<SessionScheduleItem>
        {
            new(Guid.NewGuid(), start, start.AddHours(1))
        });

        var act = () => CreateHandler().Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenDurationMismatchesEnrollment_ThrowsBadRequestAndPersistsNothing()
    {
        var (s1, s2, _, _, tutorUser) = await SeedAggregateAsync();
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);
        var start = _fixedNow.AddDays(2);
        var command = new ScheduleSessionsBatchCommand(new List<SessionScheduleItem>
        {
            new(s1.Id, start, start.AddMinutes(30)),
            new(s2.Id, _fixedNow.AddDays(3), _fixedNow.AddDays(3).AddHours(1))
        });

        var act = () => CreateHandler().Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<BadRequestException>();
        (await _context.Sessions.FindAsync(s1.Id))!.Status.Should().Be(SessionStatus.Unscheduled);
        (await _context.Sessions.FindAsync(s2.Id))!.Status.Should().Be(SessionStatus.Unscheduled);
    }

    [Fact]
    public async Task Handle_WhenStartAtIsNotUtcKind_ThrowsBadRequestAndPersistsNothing()
    {
        var (s1, s2, _, _, tutorUser) = await SeedAggregateAsync();
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);
        var start = _fixedNow.AddDays(2);
        var localStart = DateTime.SpecifyKind(start, DateTimeKind.Local);
        var command = new ScheduleSessionsBatchCommand(new List<SessionScheduleItem>
        {
            new(s1.Id, localStart, localStart.AddHours(1)),
            new(s2.Id, _fixedNow.AddDays(3), _fixedNow.AddDays(3).AddHours(1))
        });

        var act = () => CreateHandler().Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<BadRequestException>();
        (await _context.Sessions.FindAsync(s1.Id))!.Status.Should().Be(SessionStatus.Unscheduled);
        (await _context.Sessions.FindAsync(s2.Id))!.Status.Should().Be(SessionStatus.Unscheduled);
    }

    [Fact]
    public void Validate_WhenMoreThan50Items_Fails()
    {
        var validator = new ScheduleSessionsBatchValidator();
        var items = Enumerable.Range(0, 51)
            .Select(i => new SessionScheduleItem(Guid.NewGuid(), _fixedNow.AddDays(2), _fixedNow.AddDays(2).AddHours(1)))
            .ToList();

        validator.Validate(new ScheduleSessionsBatchCommand(items)).IsValid.Should().BeFalse();
    }

    [Fact]
    public void Validate_WhenItemsIsNull_FailsWithValidationErrorNotException()
    {
        var validator = new ScheduleSessionsBatchValidator();

        var result = validator.Validate(new ScheduleSessionsBatchCommand(null!));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Items");
    }

    [Fact]
    public void Validate_WhenDuplicateSessionIds_Fails()
    {
        var validator = new ScheduleSessionsBatchValidator();
        var id = Guid.NewGuid();
        var command = new ScheduleSessionsBatchCommand(new List<SessionScheduleItem>
        {
            new(id, _fixedNow.AddDays(2), _fixedNow.AddDays(2).AddHours(1)),
            new(id, _fixedNow.AddDays(3), _fixedNow.AddDays(3).AddHours(1))
        });

        validator.Validate(command).IsValid.Should().BeFalse();
    }
}
