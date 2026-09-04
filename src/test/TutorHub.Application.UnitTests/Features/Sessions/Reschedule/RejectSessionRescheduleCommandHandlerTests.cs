using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Sessions.Reschedule.RejectReschedule;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Sessions.Reschedule;

public class RejectSessionRescheduleCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly Mock<IAuditLogService> _auditLogMock = new();
    private readonly Mock<IClock> _clockMock = new();
    private readonly RejectSessionRescheduleCommandHandler _handler;

    private readonly DateTime _fixedNow = new(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc); // Tuesday

    public RejectSessionRescheduleCommandHandlerTests()
    {
        _clockMock.Setup(c => c.UtcNow).Returns(_fixedNow);
        _handler = new RejectSessionRescheduleCommandHandler(
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
    public async Task Handle_ValidRejection_MarksRequestRejected_LeavesSessionUntouched_LogsAudit()
    {
        // Arrange
        var (session, _, studentUser, tutorUser) = CreateTestAggregate(60, DayOfWeek.Wednesday, 8, 18);
        var originalStart = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 2, 0, 0), DateTimeKind.Utc);
        var originalEnd = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 3, 0, 0), DateTimeKind.Utc);
        session.Schedule(originalStart, originalEnd);

        var proposedStart = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 7, 0, 0), DateTimeKind.Utc);
        var proposedEnd = DateTime.SpecifyKind(new DateTime(2026, 9, 2, 8, 0, 0), DateTimeKind.Utc);

        var request = SessionRescheduleRequest.Create(
            session.Id,
            tutorUser.Id,
            studentUser.Id,
            proposedStart,
            proposedEnd,
            "Tutor needs reschedule",
            _fixedNow);

        var outboxMessages = new List<OutboxMessage>();
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.SessionRescheduleRequests).Returns(MockDbSetHelper.CreateMockDbSet(new List<SessionRescheduleRequest> { request }).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(outboxMessages).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new RejectSessionRescheduleCommand(
            UserId: studentUser.Id,
            SessionId: session.Id,
            RequestId: request.Id,
            RejectionReason: "I have exams during that time."
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(request.Id);
        result.Status.Should().Be(RescheduleRequestStatus.Rejected);
        result.RejectionReason.Should().Be("I have exams during that time.");

        request.Status.Should().Be(RescheduleRequestStatus.Rejected);
        request.RejectionReason.Should().Be("I have exams during that time.");
        request.RespondedAt.Should().Be(_fixedNow);

        // Session schedule remains completely untouched
        session.StartAt.Should().Be(originalStart);
        session.EndAt.Should().Be(originalEnd);
        session.Status.Should().Be(SessionStatus.Scheduled);

        // Outbox is NOT touched on reject
        outboxMessages.Should().BeEmpty();

        // AuditLog recorded
        _auditLogMock.Verify(a => a.LogAsync(
            "SESSION_RESCHEDULE_REJECTED",
            "SessionRescheduleRequest",
            request.Id.ToString(),
            studentUser.Id,
            It.IsAny<object>(),
            It.IsAny<object>(),
            null, null, null,
            It.IsAny<CancellationToken>()
        ), Times.Once);

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenTutorTriesToReject_ThrowsForbiddenException()
    {
        // Arrange (Strict actor model: only Student can reject)
        var (session, _, studentUser, tutorUser) = CreateTestAggregate(60);
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

        var command = new RejectSessionRescheduleCommand(
            UserId: tutorUser.Id,
            SessionId: session.Id,
            RequestId: request.Id,
            RejectionReason: "Tutor cannot reject own proposal"
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ForbiddenException>();
        ex.Which.Errors.Should().Contain("Only the Student can reject a session reschedule proposal.");
    }

    [Fact]
    public async Task Handle_WhenStrangerTriesToReject_ThrowsForbiddenException()
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
            "Reschedule",
            _fixedNow);

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.SessionRescheduleRequests).Returns(MockDbSetHelper.CreateMockDbSet(new List<SessionRescheduleRequest> { request }).Object);

        var command = new RejectSessionRescheduleCommand(
            UserId: Guid.NewGuid(),
            SessionId: session.Id,
            RequestId: request.Id,
            RejectionReason: "Stranger"
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

        var command = new RejectSessionRescheduleCommand(
            UserId: Guid.NewGuid(),
            SessionId: Guid.NewGuid(),
            RequestId: Guid.NewGuid(),
            RejectionReason: "Not found"
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

        var command = new RejectSessionRescheduleCommand(
            UserId: studentUser.Id,
            SessionId: session.Id,
            RequestId: request.Id,
            RejectionReason: "Mismatched"
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
            "Already rejected",
            _fixedNow);
        request.Reject(studentUser.Id, "Already rejected", _fixedNow);

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.SessionRescheduleRequests).Returns(MockDbSetHelper.CreateMockDbSet(new List<SessionRescheduleRequest> { request }).Object);

        var command = new RejectSessionRescheduleCommand(
            UserId: studentUser.Id,
            SessionId: session.Id,
            RequestId: request.Id,
            RejectionReason: "Again"
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain("Reschedule request has already been resolved with status 'Rejected'.");
    }
}
