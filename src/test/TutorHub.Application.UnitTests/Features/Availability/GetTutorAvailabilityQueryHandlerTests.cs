using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Availability.Common;
using TutorHub.Application.Features.Availability.GetTutorAvailability;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Availability;

public class GetTutorAvailabilityQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly GetTutorAvailabilityQueryHandler _handler;

    private readonly List<TutorProfile> _tutorProfiles = new();
    private readonly List<TutorApplication> _tutorApplications = new();
    private readonly List<AvailabilitySlot> _availabilitySlots = new();
    private readonly List<Session> _sessions = new();

    public GetTutorAvailabilityQueryHandlerTests()
    {
        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(_tutorProfiles).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(_tutorApplications).Object);
        _contextMock.Setup(c => c.AvailabilitySlots).Returns(MockDbSetHelper.CreateMockDbSet(_availabilitySlots).Object);
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(_sessions).Object);

        _handler = new GetTutorAvailabilityQueryHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WhenSessionInUtc_CorrectlyConvertsToLocalTimeBeforeSubtracting()
    {
        var tutorUser = new User { Id = Guid.NewGuid(), FullName = "Tutor Bob" };
        var tutor = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };
        _tutorProfiles.Add(tutor);

        var app = new TutorApplication
        {
            Id = Guid.NewGuid(),
            UserId = tutorUser.Id
        };
        app.Approve(Guid.NewGuid());
        _tutorApplications.Add(app);

        // Determine next Wednesday in local canonical timezone
        var localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, AvailabilityMutationPolicy.CanonicalTimeZone);
        var targetDate = DateOnly.FromDateTime(localNow).AddDays(3);
        var targetDayOfWeek = targetDate.DayOfWeek;

        // Tutor available 13:00 - 17:00 local time
        _availabilitySlots.Add(new AvailabilitySlot
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            DayOfWeek = targetDayOfWeek,
            StartTime = new TimeOnly(13, 0),
            EndTime = new TimeOnly(17, 0),
            IsActive = true
        });

        // Scheduled session at 14:00 - 15:30 local time on targetDate
        // Vietnam is UTC+7: Local 14:00 = UTC 07:00
        var sessionStartLocal = targetDate.ToDateTime(new TimeOnly(14, 0));
        var sessionEndLocal = targetDate.ToDateTime(new TimeOnly(15, 30));
        var sessionStartUtc = TimeZoneInfo.ConvertTimeToUtc(sessionStartLocal, AvailabilityMutationPolicy.CanonicalTimeZone);
        var sessionEndUtc = TimeZoneInfo.ConvertTimeToUtc(sessionEndLocal, AvailabilityMutationPolicy.CanonicalTimeZone);

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id
        };

        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment
        };
        session.Schedule(sessionStartUtc, sessionEndUtc);
        _sessions.Add(session);

        var query = new GetTutorAvailabilityQuery(tutor.Id, targetDate, targetDate);

        var result = await _handler.Handle(query, CancellationToken.None);

        result.Should().NotBeNull();
        result.Days.Should().HaveCount(1);
        var day = result.Days[0];
        day.Date.Should().Be(targetDate);
        day.DayOfWeek.Should().Be(targetDayOfWeek);

        // Booked slot should accurately reflect local 14:00 - 15:30
        day.BookedSlots.Should().HaveCount(1);
        day.BookedSlots[0].StartTime.Should().Be(new TimeOnly(14, 0));
        day.BookedSlots[0].EndTime.Should().Be(new TimeOnly(15, 30));

        // Available intervals should be [13:00 - 14:00] and [15:30 - 17:00]
        day.AvailableSlots.Should().HaveCount(2);
        day.AvailableSlots[0].StartTime.Should().Be(new TimeOnly(13, 0));
        day.AvailableSlots[0].EndTime.Should().Be(new TimeOnly(14, 0));
        day.AvailableSlots[1].StartTime.Should().Be(new TimeOnly(15, 30));
        day.AvailableSlots[1].EndTime.Should().Be(new TimeOnly(17, 0));
    }
}
