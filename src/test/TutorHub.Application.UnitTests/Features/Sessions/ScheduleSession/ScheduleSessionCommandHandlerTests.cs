using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Sessions.ScheduleSession;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Sessions.ScheduleSession;

public class ScheduleSessionCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly ScheduleSessionCommandHandler _handler;

    public ScheduleSessionCommandHandlerTests()
    {
        _handler = new ScheduleSessionCommandHandler(_contextMock.Object);
    }

    private static (Session session, Enrollment enrollment, User studentUser, User tutorUser) CreateTestAggregate(
        int durationMinutes = 60,
        DayOfWeek availabilityDay = DayOfWeek.Monday,
        int availStartHour = 8,
        int availEndHour = 18)
    {
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).WithStatus(AccountStatus.Active).Build();
        var tutorProfile = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = tutorUser.Id,
            User = tutorUser,
            AvailabilitySlots = new List<AvailabilitySlot>
            {
                new AvailabilitySlot
                {
                    Id = Guid.NewGuid(),
                    DayOfWeek = availabilityDay,
                    StartTime = new TimeOnly(availStartHour, 0),
                    EndTime = new TimeOnly(availEndHour, 0),
                    IsActive = true
                }
            }
        };

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
            SessionDurationMinutes = durationMinutes,
            TeachingMode = TeachingMode.Online
        };

        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            SessionNumber = 1,
            EarningAmount = 333_333m
        };

        enrollment.Sessions.Add(session);

        return (session, enrollment, studentUser, tutorUser);
    }

    [Fact]
    public async Task Handle_FromUnscheduled_SetsScheduledTimesSuccessfully()
    {
        // Arrange
        // Next Monday 09:00 - 10:00 Vietnam time (02:00 - 03:00 UTC)
        var (session, _, studentUser, _) = CreateTestAggregate(60, DayOfWeek.Monday, 8, 18);

        // Find next Monday in UTC that corresponds to Monday 09:00 VN time (02:00 UTC)
        var todayUtc = DateTime.UtcNow.Date;
        var daysUntilMonday = ((int)DayOfWeek.Monday - (int)todayUtc.DayOfWeek + 7) % 7;
        if (daysUntilMonday == 0) daysUntilMonday = 7;
        var nextMondayUtc = todayUtc.AddDays(daysUntilMonday);

        var startUtc = DateTime.SpecifyKind(nextMondayUtc.AddHours(2), DateTimeKind.Utc); // 09:00 VN
        var endUtc = DateTime.SpecifyKind(nextMondayUtc.AddHours(3), DateTimeKind.Utc);   // 10:00 VN

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(new List<Booking>()).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new ScheduleSessionCommand(studentUser.Id, session.Id, startUtc, endUtc);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(SessionStatus.Scheduled);
        result.StartAt.Should().Be(startUtc);
        result.EndAt.Should().Be(endUtc);
        session.Status.Should().Be(SessionStatus.Scheduled);

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenAlreadyScheduled_ThrowsConflictException_AgreedScheduleCannotBeUnilaterallyModified()
    {
        // Arrange
        var (session, _, studentUser, _) = CreateTestAggregate(60);
        var futureUtc = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(7), DateTimeKind.Utc);
        session.Schedule(futureUtc, futureUtc.AddHours(1)); // Already Scheduled!

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);

        var command = new ScheduleSessionCommand(studentUser.Id, session.Id, futureUtc.AddDays(1), futureUtc.AddDays(1).AddHours(1));

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain("Cannot schedule session in 'Scheduled' status. Agreed schedules cannot be unilaterally modified.");
    }

    [Fact]
    public async Task Handle_WhenDateTimeKindIsNotUtc_ThrowsBadRequestException()
    {
        // Arrange
        var (session, _, studentUser, _) = CreateTestAggregate(60);
        var localTime = DateTime.SpecifyKind(DateTime.Now.AddDays(2), DateTimeKind.Local);

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);

        var command = new ScheduleSessionCommand(studentUser.Id, session.Id, localTime, localTime.AddHours(1));

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("StartAt and EndAt must be in UTC format (ISO 8601 with Z).");
    }

    [Fact]
    public async Task Handle_WhenUtcInstantMapsToCanonicalTutorAvailability_Succeeds()
    {
        // Arrange
        // Tutor available Wednesday 14:00 - 17:00 VN time (UTC: 07:00 - 10:00)
        var (session, _, _, tutorUser) = CreateTestAggregate(60, DayOfWeek.Wednesday, 14, 17);

        var todayUtc = DateTime.UtcNow.Date;
        var daysUntilWed = ((int)DayOfWeek.Wednesday - (int)todayUtc.DayOfWeek + 7) % 7;
        if (daysUntilWed == 0) daysUntilWed = 7;
        var nextWedUtc = todayUtc.AddDays(daysUntilWed);

        var startUtc = DateTime.SpecifyKind(nextWedUtc.AddHours(8), DateTimeKind.Utc); // 15:00 VN
        var endUtc = DateTime.SpecifyKind(nextWedUtc.AddHours(9), DateTimeKind.Utc);   // 16:00 VN

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(new List<Booking>()).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Scheduled by Tutor (Bilateral capability)
        var command = new ScheduleSessionCommand(tutorUser.Id, session.Id, startUtc, endUtc);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Status.Should().Be(SessionStatus.Scheduled);
    }

    [Fact]
    public async Task Handle_WhenDurationDoesNotMatchPackageDuration_ThrowsBadRequestException()
    {
        // Arrange - Package duration is 60 min, but client requested 90 min
        var (session, _, studentUser, _) = CreateTestAggregate(60, DayOfWeek.Monday, 8, 18);

        var nextMonday = DateTime.UtcNow.Date.AddDays(7);
        var startUtc = DateTime.SpecifyKind(nextMonday.AddHours(2), DateTimeKind.Utc);
        var endUtc = DateTime.SpecifyKind(nextMonday.AddHours(3).AddMinutes(30), DateTimeKind.Utc); // 90 min

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);

        var command = new ScheduleSessionCommand(studentUser.Id, session.Id, startUtc, endUtc);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("Session duration must be exactly 60 minutes according to the purchased service package.");
    }

    [Fact]
    public async Task Handle_WhenDurationHasFractionalMismatch_ThrowsBadRequestException()
    {
        // Arrange - 60 min package, but requested 60 min and 30 seconds
        var (session, _, studentUser, _) = CreateTestAggregate(60);

        var nextMonday = DateTime.UtcNow.Date.AddDays(7);
        var startUtc = DateTime.SpecifyKind(nextMonday.AddHours(2), DateTimeKind.Utc);
        var endUtc = DateTime.SpecifyKind(nextMonday.AddHours(3).AddSeconds(30), DateTimeKind.Utc);

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);

        var command = new ScheduleSessionCommand(studentUser.Id, session.Id, startUtc, endUtc);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<BadRequestException>();
    }

    [Fact]
    public async Task Handle_WhenFallsOutsideTutorAvailability_ThrowsBadRequestException()
    {
        // Arrange - Tutor available 08:00 - 12:00 VN time (01:00 - 05:00 UTC). Request is 14:00 VN (07:00 UTC)
        var (session, _, studentUser, _) = CreateTestAggregate(60, DayOfWeek.Friday, 8, 12);

        var todayUtc = DateTime.UtcNow.Date;
        var daysUntilFri = ((int)DayOfWeek.Friday - (int)todayUtc.DayOfWeek + 7) % 7;
        if (daysUntilFri == 0) daysUntilFri = 7;
        var nextFriUtc = todayUtc.AddDays(daysUntilFri);

        var startUtc = DateTime.SpecifyKind(nextFriUtc.AddHours(7), DateTimeKind.Utc); // 14:00 VN
        var endUtc = DateTime.SpecifyKind(nextFriUtc.AddHours(8), DateTimeKind.Utc);   // 15:00 VN

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);

        var command = new ScheduleSessionCommand(studentUser.Id, session.Id, startUtc, endUtc);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("The requested session time falls outside of the tutor's weekly availability schedule.");
    }

    [Fact]
    public async Task Handle_WhenSessionIsAtExactAvailabilityBoundary_Succeeds()
    {
        // Arrange - Tutor available 08:00 - 09:00 VN time (01:00 - 02:00 UTC). Exactly 60 min slot.
        var (session, _, studentUser, _) = CreateTestAggregate(60, DayOfWeek.Saturday, 8, 9);

        var todayUtc = DateTime.UtcNow.Date;
        var daysUntilSat = ((int)DayOfWeek.Saturday - (int)todayUtc.DayOfWeek + 7) % 7;
        if (daysUntilSat == 0) daysUntilSat = 7;
        var nextSatUtc = todayUtc.AddDays(daysUntilSat);

        var startUtc = DateTime.SpecifyKind(nextSatUtc.AddHours(1), DateTimeKind.Utc); // 08:00 VN
        var endUtc = DateTime.SpecifyKind(nextSatUtc.AddHours(2), DateTimeKind.Utc);   // 09:00 VN

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(new List<Booking>()).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new ScheduleSessionCommand(studentUser.Id, session.Id, startUtc, endUtc);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Status.Should().Be(SessionStatus.Scheduled);
    }

    [Fact]
    public async Task Handle_WhenSessionTouchesAnotherSessionBoundary_DoesNotConflict()
    {
        // Arrange - Tutor has session 08:00-09:00 VN. We request 09:00-10:00 VN.
        var (session, enrollment, studentUser, _) = CreateTestAggregate(60, DayOfWeek.Monday, 8, 12);

        var todayUtc = DateTime.UtcNow.Date;
        var daysUntilMon = ((int)DayOfWeek.Monday - (int)todayUtc.DayOfWeek + 7) % 7;
        if (daysUntilMon == 0) daysUntilMon = 7;
        var nextMonUtc = todayUtc.AddDays(daysUntilMon);

        var existingSession = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            SessionNumber = 2
        };
        var existingStart = DateTime.SpecifyKind(nextMonUtc.AddHours(1), DateTimeKind.Utc); // 08:00 VN
        var existingEnd = DateTime.SpecifyKind(nextMonUtc.AddHours(2), DateTimeKind.Utc);   // 09:00 VN
        existingSession.Schedule(existingStart, existingEnd);

        var startUtc = DateTime.SpecifyKind(nextMonUtc.AddHours(2), DateTimeKind.Utc); // 09:00 VN (touches boundary!)
        var endUtc = DateTime.SpecifyKind(nextMonUtc.AddHours(3), DateTimeKind.Utc);   // 10:00 VN

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session, existingSession }).Object);
        _contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(new List<Booking>()).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new ScheduleSessionCommand(studentUser.Id, session.Id, startUtc, endUtc);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Status.Should().Be(SessionStatus.Scheduled);
    }

    [Fact]
    public async Task Handle_WhenOverlapsWithAnotherScheduledSession_ThrowsConflictException()
    {
        // Arrange - Tutor has session 09:00-10:00 VN. We request 09:30-10:30 VN.
        var (session, enrollment, studentUser, _) = CreateTestAggregate(60, DayOfWeek.Monday, 8, 18);

        var todayUtc = DateTime.UtcNow.Date;
        var daysUntilMon = ((int)DayOfWeek.Monday - (int)todayUtc.DayOfWeek + 7) % 7;
        if (daysUntilMon == 0) daysUntilMon = 7;
        var nextMonUtc = todayUtc.AddDays(daysUntilMon);

        var existingSession = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            SessionNumber = 2
        };
        var existingStart = DateTime.SpecifyKind(nextMonUtc.AddHours(2), DateTimeKind.Utc); // 09:00 VN
        var existingEnd = DateTime.SpecifyKind(nextMonUtc.AddHours(3), DateTimeKind.Utc);   // 10:00 VN
        existingSession.Schedule(existingStart, existingEnd);

        var startUtc = DateTime.SpecifyKind(nextMonUtc.AddHours(2).AddMinutes(30), DateTimeKind.Utc); // 09:30 VN (Overlaps!)
        var endUtc = DateTime.SpecifyKind(nextMonUtc.AddHours(3).AddMinutes(30), DateTimeKind.Utc);   // 10:30 VN

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session, existingSession }).Object);

        var command = new ScheduleSessionCommand(studentUser.Id, session.Id, startUtc, endUtc);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain("The tutor already has another scheduled session during this time slot.");
    }

    [Fact]
    public async Task Handle_WhenEnrollmentIsCancelled_ThrowsBadRequestException()
    {
        // Arrange
        var (session, enrollment, studentUser, _) = CreateTestAggregate(60);
        enrollment.Cancel("Cancelled enrollment");

        var futureUtc = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(7), DateTimeKind.Utc);
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);

        var command = new ScheduleSessionCommand(studentUser.Id, session.Id, futureUtc, futureUtc.AddHours(1));

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("Cannot schedule sessions for an inactive or cancelled enrollment.");
    }

    [Fact]
    public async Task Handle_WhenEnrollmentIsCompleted_ThrowsBadRequestException()
    {
        // Arrange - All sessions completed -> Enrollment status is Completed
        var (session, enrollment, studentUser, _) = CreateTestAggregate(60);
        enrollment.TotalSessions = 1;
        var futureUtc = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(7), DateTimeKind.Utc);
        session.Schedule(futureUtc, futureUtc.AddHours(1));
        session.Complete();
        enrollment.RecordCompletedSession(session.Id); // Transitions enrollment to Completed

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);

        var command = new ScheduleSessionCommand(studentUser.Id, session.Id, futureUtc.AddDays(1), futureUtc.AddDays(1).AddHours(1));

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("Cannot schedule sessions for an inactive or cancelled enrollment.");
    }

    [Fact]
    public async Task Handle_WhenUserIsNotParticipant_ThrowsForbiddenException()
    {
        // Arrange
        var (session, _, _, _) = CreateTestAggregate(60);
        var strangerId = Guid.NewGuid();
        var futureUtc = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(7), DateTimeKind.Utc);

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);

        var command = new ScheduleSessionCommand(strangerId, session.Id, futureUtc, futureUtc.AddHours(1));

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Handle_WhenSessionNotFound_ThrowsNotFoundException()
    {
        // Arrange
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session>()).Object);
        var futureUtc = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(7), DateTimeKind.Utc);

        var command = new ScheduleSessionCommand(Guid.NewGuid(), Guid.NewGuid(), futureUtc, futureUtc.AddHours(1));

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }
}
