using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Sessions.Reschedule.AcceptReschedule;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Sessions.Reschedule;

public class AcceptSessionRescheduleCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly Mock<IAuditLogService> _auditLogMock = new();
    private readonly Mock<IClock> _clockMock = new();
    private readonly AcceptSessionRescheduleCommandHandler _handler;

    private readonly DateTime _fixedNow = new(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc); // Tuesday

    public AcceptSessionRescheduleCommandHandlerTests()
    {
        _clockMock.Setup(c => c.UtcNow).Returns(_fixedNow);
        _handler = new AcceptSessionRescheduleCommandHandler(
            _contextMock.Object,
            _auditLogMock.Object,
            _clockMock.Object);
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
    public async Task Handle_ValidAcceptance_ReschedulesSession_EmitsOutbox_LogsAudit_AtomicCommit()
    {
        // Arrange
        var (session, _, studentUser, tutorUser) = CreateTestAggregate(60, DayOfWeek.Wednesday, 8, 18);
        var previousStart = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 2, 0, 0), DateTimeKind.Utc);
        var previousEnd = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 3, 0, 0), DateTimeKind.Utc);
        session.Schedule(previousStart, previousEnd);

        var proposedStart = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 7, 0, 0), DateTimeKind.Utc);
        var proposedEnd = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 8, 0, 0), DateTimeKind.Utc);

        var request = SessionRescheduleRequest.Create(
            session.Id,
            tutorUser.Id,
            studentUser.Id,
            proposedStart,
            proposedEnd,
            "Urgent reschedule",
            _fixedNow);

        var outboxMessages = new List<OutboxMessage>();
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.SessionRescheduleRequests).Returns(MockDbSetHelper.CreateMockDbSet(new List<SessionRescheduleRequest> { request }).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outboxMessages).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new AcceptSessionRescheduleCommand(
            UserId: studentUser.Id,
            SessionId: session.Id,
            RequestId: request.Id
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(session.Id);
        result.StartAt.Should().Be(proposedStart);
        result.EndAt.Should().Be(proposedEnd);
        result.Status.Should().Be(SessionStatus.Scheduled);

        session.StartAt.Should().Be(proposedStart);
        session.EndAt.Should().Be(proposedEnd);
        request.Status.Should().Be(RescheduleRequestStatus.Accepted);
        request.RespondedAt.Should().Be(_fixedNow);

        // Outbox event captured previous timestamps and new timestamps
        outboxMessages.Should().HaveCount(1);
        outboxMessages[0].EventType.Should().Be(BusinessEventTypes.SessionRescheduled);
        outboxMessages[0].AggregateId.Should().Be(session.Id);

        // AuditLog called inside same unit of work
        _auditLogMock.Verify(a => a.LogAsync(
            "SESSION_RESCHEDULED",
            "Session",
            session.Id.ToString(),
            studentUser.Id,
            It.IsAny<object>(),
            It.IsAny<object>(),
            null, null, null,
            It.IsAny<CancellationToken>()
        ), Times.Once);

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenTutorTriesToAccept_ThrowsForbiddenException()
    {
        // Arrange (Strict actor model: only Student can accept)
        var (session, _, studentUser, tutorUser) = CreateTestAggregate(60, DayOfWeek.Wednesday, 8, 18);
        var futureStart = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 2, 0, 0), DateTimeKind.Utc);
        session.Schedule(futureStart, futureStart.AddHours(1));

        var request = SessionRescheduleRequest.Create(
            session.Id,
            tutorUser.Id,
            studentUser.Id,
            futureStart.AddHours(2),
            futureStart.AddHours(3),
            "Reschedule",
            _fixedNow);

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.SessionRescheduleRequests).Returns(MockDbSetHelper.CreateMockDbSet(new List<SessionRescheduleRequest> { request }).Object);

        var command = new AcceptSessionRescheduleCommand(
            UserId: tutorUser.Id,
            SessionId: session.Id,
            RequestId: request.Id
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ForbiddenException>();
        ex.Which.Errors.Should().Contain("Only the Student can accept a session reschedule proposal.");
    }

    [Fact]
    public async Task Handle_WhenStrangerTriesToAccept_ThrowsForbiddenException()
    {
        // Arrange
        var (session, _, studentUser, tutorUser) = CreateTestAggregate(60, DayOfWeek.Wednesday, 8, 18);
        var futureStart = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 2, 0, 0), DateTimeKind.Utc);
        session.Schedule(futureStart, futureStart.AddHours(1));

        var request = SessionRescheduleRequest.Create(
            session.Id,
            tutorUser.Id,
            studentUser.Id,
            futureStart.AddHours(2),
            futureStart.AddHours(3),
            "Reschedule",
            _fixedNow);

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.SessionRescheduleRequests).Returns(MockDbSetHelper.CreateMockDbSet(new List<SessionRescheduleRequest> { request }).Object);

        var command = new AcceptSessionRescheduleCommand(
            UserId: Guid.NewGuid(),
            SessionId: session.Id,
            RequestId: request.Id
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Handle_WhenRequestNotFound_ThrowsNotFoundException()
    {
        // Arrange
        _contextMock.Setup(c => c.SessionRescheduleRequests).Returns(MockDbSetHelper.CreateMockDbSet(new List<SessionRescheduleRequest>()).Object);

        var command = new AcceptSessionRescheduleCommand(
            UserId: Guid.NewGuid(),
            SessionId: Guid.NewGuid(),
            RequestId: Guid.NewGuid()
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenRequestMismatchedWithSession_ThrowsNotFoundException()
    {
        // Arrange
        var (session, _, studentUser, tutorUser) = CreateTestAggregate(60);
        var differentSessionId = Guid.NewGuid();

        var request = SessionRescheduleRequest.Create(
            differentSessionId,
            tutorUser.Id,
            studentUser.Id,
            _fixedNow.AddDays(2),
            _fixedNow.AddDays(2).AddHours(1),
            "Mismatch",
            _fixedNow);

        _contextMock.Setup(c => c.SessionRescheduleRequests).Returns(MockDbSetHelper.CreateMockDbSet(new List<SessionRescheduleRequest> { request }).Object);

        var command = new AcceptSessionRescheduleCommand(
            UserId: studentUser.Id,
            SessionId: session.Id,
            RequestId: request.Id
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<NotFoundException>();
        ex.Which.Errors.Should().Contain("SessionRescheduleRequest does not belong to the specified session.");
    }

    [Fact]
    public async Task Handle_WhenRequestAlreadyResolved_ThrowsConflictException()
    {
        // Arrange
        var (session, _, studentUser, tutorUser) = CreateTestAggregate(60);
        var futureStart = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 2, 0, 0), DateTimeKind.Utc);
        session.Schedule(futureStart, futureStart.AddHours(1));

        var request = SessionRescheduleRequest.Create(
            session.Id,
            tutorUser.Id,
            studentUser.Id,
            futureStart.AddHours(2),
            futureStart.AddHours(3),
            "Already accepted",
            _fixedNow);
        request.Accept(studentUser.Id, _fixedNow);

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.SessionRescheduleRequests).Returns(MockDbSetHelper.CreateMockDbSet(new List<SessionRescheduleRequest> { request }).Object);

        var command = new AcceptSessionRescheduleCommand(
            UserId: studentUser.Id,
            SessionId: session.Id,
            RequestId: request.Id
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain("Reschedule request has already been resolved with status 'Accepted'.");
    }

    [Fact]
    public async Task Handle_WhenProposalExpired_ThrowsConflictException()
    {
        // Arrange (Proposal time is now in the past relative to current clock)
        var (session, _, studentUser, tutorUser) = CreateTestAggregate(60);
        var futureStart = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 2, 0, 0), DateTimeKind.Utc);
        session.Schedule(futureStart, futureStart.AddHours(1));

        var expiredProposedStart = _fixedNow.AddHours(-1); // in the past!
        var request = SessionRescheduleRequest.Create(
            session.Id,
            tutorUser.Id,
            studentUser.Id,
            expiredProposedStart,
            expiredProposedStart.AddHours(1),
            "Expired proposal",
            _fixedNow.AddDays(-1));

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.SessionRescheduleRequests).Returns(MockDbSetHelper.CreateMockDbSet(new List<SessionRescheduleRequest> { request }).Object);

        var command = new AcceptSessionRescheduleCommand(
            UserId: studentUser.Id,
            SessionId: session.Id,
            RequestId: request.Id
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain("Cannot accept an expired reschedule proposal.");
    }

    [Fact]
    public async Task Handle_WhenAttendanceVerificationAlreadyOpened_ThrowsConflictException()
    {
        // Arrange (Canonical attendance guard: cannot reschedule once attendance verification begins)
        var (session, _, studentUser, tutorUser) = CreateTestAggregate(60);
        var futureStart = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 2, 0, 0), DateTimeKind.Utc);
        session.Schedule(futureStart, futureStart.AddHours(1));
        typeof(Session).GetProperty(nameof(Session.AttendanceVerificationOpenedAt))!.SetValue(session, _fixedNow);

        var request = SessionRescheduleRequest.Create(
            session.Id,
            tutorUser.Id,
            studentUser.Id,
            futureStart.AddHours(2),
            futureStart.AddHours(3),
            "Late accept",
            _fixedNow);

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.SessionRescheduleRequests).Returns(MockDbSetHelper.CreateMockDbSet(new List<SessionRescheduleRequest> { request }).Object);

        var command = new AcceptSessionRescheduleCommand(
            UserId: studentUser.Id,
            SessionId: session.Id,
            RequestId: request.Id
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain("Cannot reschedule a session after attendance verification has begun.");
    }

    [Fact]
    public async Task Handle_WhenAuthoritativeOverlapDetected_ThrowsConflictException()
    {
        // Arrange (Tutor has booked another session that now conflicts with proposed time)
        var (session1, enrollment, studentUser, tutorUser) = CreateTestAggregate(60, DayOfWeek.Wednesday, 8, 18);
        var futureStart1 = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 2, 0, 0), DateTimeKind.Utc);
        session1.Schedule(futureStart1, futureStart1.AddHours(1));

        var proposedStart = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 7, 0, 0), DateTimeKind.Utc);
        var proposedEnd = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 8, 0, 0), DateTimeKind.Utc);

        var request = SessionRescheduleRequest.Create(
            session1.Id,
            tutorUser.Id,
            studentUser.Id,
            proposedStart,
            proposedEnd,
            "Reschedule",
            _fixedNow);

        // Conflicting session scheduled between proposal and acceptance
        var conflictingSession = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            SessionNumber = 2
        };
        conflictingSession.Schedule(proposedStart, proposedEnd);

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session1, conflictingSession }).Object);
        _contextMock.Setup(c => c.SessionRescheduleRequests).Returns(MockDbSetHelper.CreateMockDbSet(new List<SessionRescheduleRequest> { request }).Object);

        var command = new AcceptSessionRescheduleCommand(
            UserId: studentUser.Id,
            SessionId: session1.Id,
            RequestId: request.Id
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain("The tutor already has another scheduled session during this time slot.");
    }
}
