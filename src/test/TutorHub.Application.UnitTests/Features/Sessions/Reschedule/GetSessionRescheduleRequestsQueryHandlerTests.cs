using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Sessions.Reschedule.GetRescheduleRequests;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Sessions.Reschedule;

public class GetSessionRescheduleRequestsQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly StubCurrentUserService _currentUserService = new();
    private readonly GetSessionRescheduleRequestsQueryHandler _handler;

    public GetSessionRescheduleRequestsQueryHandlerTests()
    {
        _handler = new GetSessionRescheduleRequestsQueryHandler(_contextMock.Object, _currentUserService);
    }

    private static (Session session, Enrollment enrollment, User studentUser, User tutorUser) CreateTestAggregate()
    {
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).WithStatus(AccountStatus.Active).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

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

        // F-15: Active lifecycle (harmless for read-only history query).
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
    public async Task Handle_WhenStudentParticipantQueries_ReturnsHistoryListOrderedByCreatedAtDesc()
    {
        // Arrange
        var (session, _, studentUser, tutorUser) = CreateTestAggregate();
        var now = DateTime.UtcNow;

        var req1 = SessionRescheduleRequest.Create(
            session.Id,
            tutorUser.Id,
            studentUser.Id,
            now.AddDays(2),
            now.AddDays(2).AddHours(1),
            "First request",
            now.AddHours(-10));

        var req2 = SessionRescheduleRequest.Create(
            session.Id,
            tutorUser.Id,
            studentUser.Id,
            now.AddDays(3),
            now.AddDays(3).AddHours(1),
            "Second request",
            now.AddHours(-1));

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.SessionRescheduleRequests).Returns(MockDbSetHelper.CreateMockDbSet(new List<SessionRescheduleRequest> { req1, req2 }).Object);

        var query = new GetSessionRescheduleRequestsQuery(session.Id);
        _currentUserService.Set(studentUser.Id, UserRole.Student);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result[0].Id.Should().Be(req2.Id); // latest first
        result[1].Id.Should().Be(req1.Id);
    }

    [Fact]
    public async Task Handle_WhenTutorParticipantQueries_ReturnsHistoryList()
    {
        // Arrange
        var (session, _, studentUser, tutorUser) = CreateTestAggregate();
        var now = DateTime.UtcNow;

        var req = SessionRescheduleRequest.Create(
            session.Id,
            tutorUser.Id,
            studentUser.Id,
            now.AddDays(2),
            now.AddDays(2).AddHours(1),
            "Tutor request",
            now);

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);
        _contextMock.Setup(c => c.SessionRescheduleRequests).Returns(MockDbSetHelper.CreateMockDbSet(new List<SessionRescheduleRequest> { req }).Object);

        var query = new GetSessionRescheduleRequestsQuery(session.Id);
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result[0].Id.Should().Be(req.Id);
    }

    [Fact]
    public async Task Handle_WhenNonParticipantQueries_ThrowsForbiddenException()
    {
        // Arrange
        var (session, _, _, _) = CreateTestAggregate();
        var strangerId = Guid.NewGuid();

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);

        var query = new GetSessionRescheduleRequestsQuery(session.Id);
        _currentUserService.Set(strangerId, UserRole.Student);

        // Act
        var act = () => _handler.Handle(query, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ForbiddenException>();
        ex.Which.Errors.Should().Contain("You do not have permission to view reschedule requests for this session.");
    }

    [Fact]
    public async Task Handle_WhenSessionNotFound_ThrowsNotFoundException()
    {
        // Arrange
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session>()).Object);

        var query = new GetSessionRescheduleRequestsQuery(Guid.NewGuid());
        _currentUserService.Set(Guid.NewGuid(), UserRole.Student);

        // Act
        var act = () => _handler.Handle(query, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }
}
