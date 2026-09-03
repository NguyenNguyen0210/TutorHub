using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Availability.Common;
using TutorHub.Application.Features.Availability.DeleteAvailabilitySlot;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Availability;

public class DeleteAvailabilitySlotCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly DeleteAvailabilitySlotCommandHandler _handler;

    private readonly List<TutorProfile> _tutorProfiles = new();
    private readonly List<AvailabilitySlot> _availabilitySlots = new();
    private readonly List<Session> _sessions = new();

    public DeleteAvailabilitySlotCommandHandlerTests()
    {
        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(_tutorProfiles).Object);
        _contextMock.Setup(c => c.AvailabilitySlots).Returns(MockDbSetHelper.CreateMockDbSet(_availabilitySlots).Object);
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(_sessions).Object);

        _handler = new DeleteAvailabilitySlotCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WhenSlotCoversFutureScheduledSession_ThrowsConflictException()
    {
        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor" };
        var tutor = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };
        _tutorProfiles.Add(tutor);

        var localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, AvailabilityMutationPolicy.CanonicalTimeZone);
        var targetDate = DateOnly.FromDateTime(localNow).AddDays(4);
        var targetDayOfWeek = targetDate.DayOfWeek;

        var slot = new AvailabilitySlot
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            DayOfWeek = targetDayOfWeek,
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(12, 0),
            IsActive = true
        };
        _availabilitySlots.Add(slot);

        // Upcoming scheduled session inside this window
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

        var command = new DeleteAvailabilitySlotCommand(slot.Id, tutorUser.Id);

        var act = () => _handler.Handle(command, CancellationToken.None);

        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("upcoming session"));
        _availabilitySlots.Should().HaveCount(1); // Slot was not deleted
    }

    [Fact]
    public async Task Handle_WhenSlotCoversPastSession_AllowsDeletion()
    {
        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor" };
        var tutor = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };
        _tutorProfiles.Add(tutor);

        var slot = new AvailabilitySlot
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            DayOfWeek = DayOfWeek.Monday,
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(12, 0),
            IsActive = true
        };
        _availabilitySlots.Add(slot);

        // Session was in the past (StartAt is in the past)
        var enrollment = new Enrollment { Id = Guid.NewGuid(), TutorProfileId = tutor.Id };
        var pastSession = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment
        };
        pastSession.Schedule(DateTime.UtcNow.AddDays(-10), DateTime.UtcNow.AddDays(-10).AddHours(1));
        _sessions.Add(pastSession);

        var command = new DeleteAvailabilitySlotCommand(slot.Id, tutorUser.Id);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Should().BeTrue();
        _availabilitySlots.Should().BeEmpty();
    }
}
