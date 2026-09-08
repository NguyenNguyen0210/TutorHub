using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Sessions.GetMySessions;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Sessions.GetMySessions;

public class GetMySessionsQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly GetMySessionsQueryHandler _handler;

    public GetMySessionsQueryHandlerTests()
    {
        _handler = new GetMySessionsQueryHandler(_contextMock.Object);
    }

    private static (Session session, Enrollment enrollment, User student, User tutor) CreateSession(
        DateTime? startAt = null,
        DateTime? endAt = null,
        SessionStatus status = SessionStatus.Unscheduled)
    {
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var subject = new Subject { Id = Guid.NewGuid(), Name = "English" };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = subject.Id,
            Subject = subject,
            ServiceId = Guid.NewGuid(),
            TotalPrice = 900_000m,
            TotalSessions = 3,
            SessionDurationMinutes = 60,
            TeachingMode = TeachingMode.Online
        };

        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            SessionNumber = 1,
            EarningAmount = 300_000m
        };

        if (startAt.HasValue && endAt.HasValue)
        {
            session.Schedule(startAt.Value, endAt.Value);
            if (status == SessionStatus.Completed)
            {
                session.Complete();
            }
        }

        enrollment.Sessions.Add(session);
        return (session, enrollment, studentUser, tutorUser);
    }

    [Fact]
    public async Task Handle_AsStudent_OnlyReturnsOwnStudentSessions()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var (s1, _, student1, _) = CreateSession(now.AddDays(1), now.AddDays(1).AddHours(1), SessionStatus.Scheduled);
        var (s2, _, _, _) = CreateSession(now.AddDays(2), now.AddDays(2).AddHours(1), SessionStatus.Scheduled); // other student

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { s1, s2 }).Object);

        var query = new GetMySessionsQuery(student1.Id, UserRole.Student);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result[0].Id.Should().Be(s1.Id);
        result[0].StudentName.Should().Be(student1.FullName);
    }

    [Fact]
    public async Task Handle_AsTutor_OnlyReturnsOwnTutorSessions()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var (s1, _, _, tutor1) = CreateSession(now.AddDays(1), now.AddDays(1).AddHours(1), SessionStatus.Scheduled);
        var (s2, _, _, _) = CreateSession(now.AddDays(2), now.AddDays(2).AddHours(1), SessionStatus.Scheduled); // other tutor

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { s1, s2 }).Object);

        var query = new GetMySessionsQuery(tutor1.Id, UserRole.Tutor);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result[0].Id.Should().Be(s1.Id);
        result[0].TutorName.Should().Be(tutor1.FullName);
    }

    [Fact]
    public async Task Handle_WithStatusFilter_ReturnsMatchingSessions()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var (s1, e1, student, _) = CreateSession(now.AddDays(1), now.AddDays(1).AddHours(1), SessionStatus.Scheduled);
        var (s2, _, _, _) = CreateSession(now.AddDays(-1), now.AddDays(-1).AddHours(1), SessionStatus.Completed);
        s2.Enrollment.StudentProfileId = e1.StudentProfileId;
        s2.Enrollment.StudentProfile = e1.StudentProfile;

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { s1, s2 }).Object);

        var query = new GetMySessionsQuery(student.Id, UserRole.Student, SessionStatus.Scheduled);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result[0].Id.Should().Be(s1.Id);
        result[0].Status.Should().Be(SessionStatus.Scheduled);
    }

    [Fact]
    public async Task Handle_WithIntersectingDateRange_ReturnsOverlappingSession()
    {
        // Arrange
        // Calendar window: 10:00 - 12:00
        // Session: 11:00 - 13:00 (Intersects window!)
        var baseDate = DateTime.UtcNow.Date.AddDays(3);
        var sessionStart = baseDate.AddHours(11);
        var sessionEnd = baseDate.AddHours(13);

        var (session, _, student, _) = CreateSession(sessionStart, sessionEnd, SessionStatus.Scheduled);
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { session }).Object);

        var windowFrom = baseDate.AddHours(10);
        var windowTo = baseDate.AddHours(12);
        var query = new GetMySessionsQuery(student.Id, UserRole.Student, null, windowFrom, windowTo);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result[0].Id.Should().Be(session.Id);
    }

    [Fact]
    public async Task Handle_WithFromDateEqualToOrGreaterThanToDate_ThrowsBadRequestException()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var query = new GetMySessionsQuery(Guid.NewGuid(), UserRole.Student, null, now.AddDays(2), now.AddDays(1));

        // Act
        var act = () => _handler.Handle(query, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("FromDate must be strictly earlier than ToDate.");
    }

    [Fact]
    public async Task Handle_WithOnlyFromDateOrOnlyToDate_ThrowsBadRequestException()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var query = new GetMySessionsQuery(Guid.NewGuid(), UserRole.Student, null, now, null);

        // Act
        var act = () => _handler.Handle(query, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain("FromDate and ToDate must either both be provided or both omitted.");
    }

    [Fact]
    public async Task Handle_WithNullSchedule_DoesNotBreakCalendarQuery()
    {
        // Arrange - Session is Unscheduled (StartAt and EndAt are null)
        var (unscheduledSession, _, student, _) = CreateSession(); // Unscheduled
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { unscheduledSession }).Object);

        var query = new GetMySessionsQuery(student.Id, UserRole.Student);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result[0].Id.Should().Be(unscheduledSession.Id);
        result[0].StartAt.Should().BeNull();
        result[0].EndAt.Should().BeNull();
        result[0].Status.Should().Be(SessionStatus.Unscheduled);
    }

    [Fact]
    public async Task Handle_OrdersSessionsChronologically()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var (s2, e1, student, _) = CreateSession(now.AddDays(2), now.AddDays(2).AddHours(1), SessionStatus.Scheduled);
        var (s1, _, _, _) = CreateSession(now.AddDays(1), now.AddDays(1).AddHours(1), SessionStatus.Scheduled);
        s1.Enrollment.StudentProfileId = e1.StudentProfileId;
        s1.Enrollment.StudentProfile = e1.StudentProfile;

        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { s2, s1 }).Object);

        var query = new GetMySessionsQuery(student.Id, UserRole.Student);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result[0].Id.Should().Be(s1.Id); // Earliest first
        result[1].Id.Should().Be(s2.Id);
    }

    [Fact]
    public async Task Handle_DoesNotLeakUnauthorizedSessions()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var (s1, _, _, _) = CreateSession(now.AddDays(1), now.AddDays(1).AddHours(1), SessionStatus.Scheduled);
        _contextMock.Setup(c => c.Sessions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Session> { s1 }).Object);

        var strangerId = Guid.NewGuid();
        var query = new GetMySessionsQuery(strangerId, UserRole.Student);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().BeEmpty();
    }
}
