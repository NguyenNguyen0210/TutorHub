using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Availability.Common;
using TutorHub.Application.Features.Availability.DTOs;
using TutorHub.Application.Features.Availability.SetWeeklySchedule;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Availability;

public class SetWeeklyScheduleCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly SetWeeklyScheduleCommandHandler _handler;
    private readonly SetWeeklyScheduleCommandValidator _validator = new();

    private readonly List<TutorProfile> _tutorProfiles = new();
    private readonly List<AvailabilitySlot> _availabilitySlots = new();
    private readonly List<Session> _sessions = new();

    public SetWeeklyScheduleCommandHandlerTests()
    {
        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(_tutorProfiles).Object);
        _contextMock.Setup(c => c.AvailabilitySlots).Returns(MockDbSetHelper.CreateMockDbSet(_availabilitySlots).Object);
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(_sessions).Object);

        _handler = new SetWeeklyScheduleCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WhenValidDesiredSchedule_AtomicallyReplacesExistingSlots()
    {
        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor" };
        var tutor = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };
        _tutorProfiles.Add(tutor);

        // Pre-existing slot that tutor wants to replace
        _availabilitySlots.Add(new AvailabilitySlot
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            DayOfWeek = DayOfWeek.Monday,
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(12, 0),
            IsActive = true
        });

        var newSchedule = new List<WeeklyScheduleItemDto>
        {
            new(DayOfWeek.Tuesday, new TimeOnly(14, 0), new TimeOnly(18, 0)),
            new(DayOfWeek.Thursday, new TimeOnly(8, 0), new TimeOnly(11, 0))
        };

        var command = new SetWeeklyScheduleCommand(tutorUser.Id, newSchedule);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Should().HaveCount(2);
        _availabilitySlots.Should().HaveCount(2);
        _availabilitySlots.Should().NotContain(s => s.DayOfWeek == DayOfWeek.Monday);
        _availabilitySlots.Should().Contain(s => s.DayOfWeek == DayOfWeek.Tuesday && s.StartTime == new TimeOnly(14, 0));
        _availabilitySlots.Should().Contain(s => s.DayOfWeek == DayOfWeek.Thursday && s.StartTime == new TimeOnly(8, 0));
    }

    [Fact]
    public void Validator_WhenSubmittingOverlappingIntervalsOnSameDay_FailsValidation()
    {
        var schedule = new List<WeeklyScheduleItemDto>
        {
            new(DayOfWeek.Monday, new TimeOnly(8, 0), new TimeOnly(11, 0)),
            new(DayOfWeek.Monday, new TimeOnly(10, 0), new TimeOnly(12, 0)) // Overlaps 10:00 - 11:00!
        };

        var command = new SetWeeklyScheduleCommand(Guid.NewGuid(), schedule);
        var validationResult = _validator.Validate(command);

        validationResult.IsValid.Should().BeFalse();
        validationResult.Errors.Should().Contain(e => e.ErrorMessage.Contains("overlapping time windows"));
    }

    [Fact]
    public void Validator_WhenSubmittingAdjacentIntervalsTouchingAtBoundary_PassesValidation()
    {
        var schedule = new List<WeeklyScheduleItemDto>
        {
            new(DayOfWeek.Monday, new TimeOnly(8, 0), new TimeOnly(10, 0)),
            new(DayOfWeek.Monday, new TimeOnly(10, 0), new TimeOnly(12, 0)) // Touches at 10:00, not overlapping
        };

        var command = new SetWeeklyScheduleCommand(Guid.NewGuid(), schedule);
        var validationResult = _validator.Validate(command);

        validationResult.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenDesiredScheduleLeavesUpcomingSessionUncovered_ThrowsConflictException()
    {
        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor" };
        var tutor = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };
        _tutorProfiles.Add(tutor);

        var localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, AvailabilityMutationPolicy.CanonicalTimeZone);
        var targetDate = DateOnly.FromDateTime(localNow).AddDays(2);
        var targetDayOfWeek = targetDate.DayOfWeek;

        // Tutor currently has Mon 08:00 - 12:00
        _availabilitySlots.Add(new AvailabilitySlot
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            DayOfWeek = targetDayOfWeek,
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(12, 0),
            IsActive = true
        });

        // Upcoming session at 09:00 - 10:30 on targetDate
        var sessionStartLocal = targetDate.ToDateTime(new TimeOnly(9, 0));
        var sessionEndLocal = targetDate.ToDateTime(new TimeOnly(10, 30));
        var sessionStartUtc = TimeZoneInfo.ConvertTimeToUtc(sessionStartLocal, AvailabilityMutationPolicy.CanonicalTimeZone);
        var sessionEndUtc = TimeZoneInfo.ConvertTimeToUtc(sessionEndLocal, AvailabilityMutationPolicy.CanonicalTimeZone);

        var enrollment = new Enrollment { Id = Guid.NewGuid(), TutorProfileId = tutor.Id };
        var session1 = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment
        };
        session1.Schedule(sessionStartUtc, sessionEndUtc);
        _sessions.Add(session1);

        // Tutor attempts to shorten window to 10:00 - 12:00 (leaving 09:00 session uncovered!)
        var desiredSchedule = new List<WeeklyScheduleItemDto>
        {
            new(targetDayOfWeek, new TimeOnly(10, 0), new TimeOnly(12, 0))
        };

        var command = new SetWeeklyScheduleCommand(tutorUser.Id, desiredSchedule);

        var act = () => _handler.Handle(command, CancellationToken.None);

        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("upcoming session"));
        _availabilitySlots[0].StartTime.Should().Be(new TimeOnly(8, 0)); // Unchanged (fail-fast, Patch A)
    }

    [Fact]
    public async Task Handle_WhenSubmittingEmptyScheduleWithUpcomingSessions_ThrowsConflictException()
    {
        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor" };
        var tutor = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };
        _tutorProfiles.Add(tutor);

        var enrollment = new Enrollment { Id = Guid.NewGuid(), TutorProfileId = tutor.Id };
        var session2 = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment
        };
        session2.Schedule(DateTime.UtcNow.AddDays(2), DateTime.UtcNow.AddDays(2).AddHours(1));
        _sessions.Add(session2);

        var command = new SetWeeklyScheduleCommand(tutorUser.Id, new List<WeeklyScheduleItemDto>());

        var act = () => _handler.Handle(command, CancellationToken.None);

        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("upcoming session"));
    }

    [Fact]
    public async Task Handle_WhenSubmittingEmptyScheduleWithNoUpcomingSessions_ClearsAllSlots()
    {
        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor" };
        var tutor = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };
        _tutorProfiles.Add(tutor);

        _availabilitySlots.Add(new AvailabilitySlot
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            DayOfWeek = DayOfWeek.Friday,
            StartTime = new TimeOnly(14, 0),
            EndTime = new TimeOnly(18, 0),
            IsActive = true
        });

        var command = new SetWeeklyScheduleCommand(tutorUser.Id, new List<WeeklyScheduleItemDto>());

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Should().BeEmpty();
        _availabilitySlots.Should().BeEmpty();
    }
}
