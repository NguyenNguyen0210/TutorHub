using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Sessions.Reschedule.DTOs;
using TutorHub.Application.Features.Sessions.Reschedule.ProposeReschedule;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Sessions.Reschedule;

public class ProposeSessionRescheduleCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly Mock<IClock> _clockMock = new();
    private readonly StubCurrentUserService _currentUserService = new();
    private readonly ProposeSessionRescheduleCommandHandler _handler;

    private readonly DateTime _fixedNow = new(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc); // Tuesday

    public ProposeSessionRescheduleCommandHandlerTests()
    {
        _clockMock.Setup(c => c.UtcNow).Returns(_fixedNow);
        _handler = new ProposeSessionRescheduleCommandHandler(_contextMock.Object, _clockMock.Object, _currentUserService);
    }

    private static (Session session, Enrollment enrollment, User studentUser, User tutorUser) CreateTestAggregate(
        int durationMinutes = 60,
        DayOfWeek availabilityDay = DayOfWeek.Wednesday,
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
            AvailabilitySlots = new List<AvailabilitySlot>()
        };
        // F-23: slots via factory (Id auto-generated).
        tutorProfile.AvailabilitySlots.Add(AvailabilitySlot.Create(
            tutorProfile.Id,
            availabilityDay,
            new TimeOnly(availStartHour, 0),
            new TimeOnly(availEndHour, 0)));

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

        // F-15: lifecycle tests run against Active enrollments.
        enrollment.Activate();

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
    public async Task Handle_ValidProposal_ReturnsCreatedDto_DoesNotMutateSessionSchedule()
    {
        // Arrange
        // Current agreed session: Wednesday 09:00 - 10:00 VN (02:00 - 03:00 UTC)
        var (session, enrollment, studentUser, tutorUser) = CreateTestAggregate(60, DayOfWeek.Wednesday, 8, 18);
        var currentStart = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 2, 0, 0), DateTimeKind.Utc);
        var currentEnd = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 3, 0, 0), DateTimeKind.Utc);
        session.Schedule(currentStart, currentEnd);

        // Proposed new session: Wednesday 14:00 - 15:00 VN (07:00 - 08:00 UTC)
        var proposedStart = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 7, 0, 0), DateTimeKind.Utc);
        var proposedEnd = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 8, 0, 0), DateTimeKind.Utc);

        var requestsList = new List<SessionRescheduleRequest>();
        var sessionsList = new List<Session> { session };

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(sessionsList).Object);
        _contextMock.Setup(c => c.SessionRescheduleRequests).Returns(MockDbSetHelper.CreateMockDbSet(requestsList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new ProposeSessionRescheduleCommand(
            SessionId: session.Id,
            ProposedStartAt: proposedStart,
            ProposedEndAt: proposedEnd,
            Reason: "Need to adjust for emergency."
        );
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.SessionId.Should().Be(session.Id);
        result.ProposerUserId.Should().Be(tutorUser.Id);
        result.RecipientUserId.Should().Be(studentUser.Id);
        result.ProposedStartAt.Should().Be(proposedStart);
        result.ProposedEndAt.Should().Be(proposedEnd);
        result.Status.Should().Be(RescheduleRequestStatus.Pending);

        // Crucial: Session schedule must NOT change on propose (DEC-RESCHED-001, FR-SESSION-004)
        session.StartAt.Should().Be(currentStart);
        session.EndAt.Should().Be(currentEnd);

        _contextMock.Verify(c => c.SessionRescheduleRequests.Add(It.IsAny<SessionRescheduleRequest>()), Times.Once);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenStudentProposes_ThrowsForbiddenException()
    {
        // Arrange (Strict actor model: only Tutor can propose)
        var (session, _, studentUser, _) = CreateTestAggregate(60);
        var futureUtc = _fixedNow.AddDays(1);
        session.Schedule(futureUtc, futureUtc.AddHours(1));

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);

        var command = new ProposeSessionRescheduleCommand(
            SessionId: session.Id,
            ProposedStartAt: futureUtc.AddDays(1),
            ProposedEndAt: futureUtc.AddDays(1).AddHours(1),
            Reason: "Student trying to propose"
        );
        _currentUserService.Set(studentUser.Id, UserRole.Student);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ForbiddenException>();
        ex.Which.Errors.Should().Contain("Only the Tutor can propose a session reschedule.");
    }

    [Fact]
    public async Task Handle_WhenStrangerProposes_ThrowsForbiddenException()
    {
        // Arrange
        var (session, _, _, _) = CreateTestAggregate(60);
        var futureUtc = _fixedNow.AddDays(1);
        session.Schedule(futureUtc, futureUtc.AddHours(1));

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);

        var command = new ProposeSessionRescheduleCommand(
            SessionId: session.Id,
            ProposedStartAt: futureUtc.AddDays(1),
            ProposedEndAt: futureUtc.AddDays(1).AddHours(1),
            Reason: "Stranger"
        );
        _currentUserService.Set(Guid.NewGuid(), UserRole.Tutor);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Handle_WhenSessionNotScheduled_ThrowsConflictException()
    {
        // Arrange (Unscheduled session cannot be rescheduled; it must be scheduled first)
        var (session, _, _, tutorUser) = CreateTestAggregate(60);

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);

        var proposedStart = _fixedNow.AddDays(1);
        var command = new ProposeSessionRescheduleCommand(
            SessionId: session.Id,
            ProposedStartAt: proposedStart,
            ProposedEndAt: proposedStart.AddHours(1),
            Reason: null
        );
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain("Cannot reschedule session in 'Unscheduled' status. Session must be Scheduled.");
    }

    [Fact]
    public async Task Handle_WhenSessionInPast_ThrowsConflictException()
    {
        // Arrange
        var (session, _, _, tutorUser) = CreateTestAggregate(60);
        var pastStart = _fixedNow.AddHours(-2);
        session.Schedule(pastStart, pastStart.AddHours(1));

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);

        var proposedStart = _fixedNow.AddDays(1);
        var command = new ProposeSessionRescheduleCommand(
            SessionId: session.Id,
            ProposedStartAt: proposedStart,
            ProposedEndAt: proposedStart.AddHours(1),
            Reason: null
        );
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain("Cannot reschedule a session that has already started or taken place.");
    }

    [Fact]
    public async Task Handle_WhenAttendanceVerificationOpened_ThrowsConflictException()
    {
        // Arrange
        var (session, _, _, tutorUser) = CreateTestAggregate(60);
        var futureStart = _fixedNow.AddDays(1);
        session.Schedule(futureStart, futureStart.AddHours(1));
        typeof(Session).GetProperty(nameof(Session.AttendanceVerificationOpenedAt))!.SetValue(session, _fixedNow);

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);

        var proposedStart = _fixedNow.AddDays(2);
        var command = new ProposeSessionRescheduleCommand(
            SessionId: session.Id,
            ProposedStartAt: proposedStart,
            ProposedEndAt: proposedStart.AddHours(1),
            Reason: null
        );
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain("Cannot reschedule a session after attendance verification has begun.");
    }

    [Fact]
    public async Task Handle_WhenProposedStartAtInPast_ThrowsBadRequestException()
    {
        // Arrange
        var (session, _, _, tutorUser) = CreateTestAggregate(60);
        var futureStart = _fixedNow.AddDays(1);
        session.Schedule(futureStart, futureStart.AddHours(1));

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);

        var pastStart = _fixedNow.AddHours(-1);
        var command = new ProposeSessionRescheduleCommand(
            SessionId: session.Id,
            ProposedStartAt: pastStart,
            ProposedEndAt: pastStart.AddHours(1),
            Reason: null
        );
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("Proposed start time must be in the future.");
    }

    [Fact]
    public async Task Handle_WhenPendingProposalAlreadyExists_ThrowsConflictException()
    {
        // Arrange
        var (session, _, studentUser, tutorUser) = CreateTestAggregate(60, DayOfWeek.Wednesday, 8, 18);
        var futureStart = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 2, 0, 0), DateTimeKind.Utc);
        session.Schedule(futureStart, futureStart.AddHours(1));

        var existingPending = SessionRescheduleRequest.Create(
            session.Id,
            tutorUser.Id,
            studentUser.Id,
            futureStart.AddHours(2),
            futureStart.AddHours(3),
            "First proposal",
            _fixedNow);

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.SessionRescheduleRequests).Returns(MockDbSetHelper.CreateMockDbSet(new List<SessionRescheduleRequest> { existingPending }).Object);

        var proposedStart = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 7, 0, 0), DateTimeKind.Utc);
        var proposedEnd = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 8, 0, 0), DateTimeKind.Utc);

        var command = new ProposeSessionRescheduleCommand(
            SessionId: session.Id,
            ProposedStartAt: proposedStart,
            ProposedEndAt: proposedEnd,
            Reason: "Second proposal"
        );
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain("A pending reschedule request already exists for this session.");
    }

    [Fact]
    public async Task Handle_WhenTutorHasOverlappingSession_ThrowsConflictException()
    {
        // Arrange
        var (session1, enrollment, _, tutorUser) = CreateTestAggregate(60, DayOfWeek.Wednesday, 8, 18);
        var futureStart1 = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 2, 0, 0), DateTimeKind.Utc);
        session1.Schedule(futureStart1, futureStart1.AddHours(1));

        // Create another scheduled session for the same tutor
        var session2 = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            SessionNumber = 2
        };
        var overlappingStart = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 7, 0, 0), DateTimeKind.Utc);
        var overlappingEnd = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 8, 0, 0), DateTimeKind.Utc);
        session2.Schedule(overlappingStart, overlappingEnd);

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session1, session2 }).Object);
        _contextMock.Setup(c => c.SessionRescheduleRequests).Returns(MockDbSetHelper.CreateMockDbSet(new List<SessionRescheduleRequest>()).Object);

        var command = new ProposeSessionRescheduleCommand(
            SessionId: session1.Id,
            ProposedStartAt: overlappingStart,
            ProposedEndAt: overlappingEnd,
            Reason: "Overlapping proposal"
        );
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain("The tutor already has another scheduled session during this time slot.");
    }
}
