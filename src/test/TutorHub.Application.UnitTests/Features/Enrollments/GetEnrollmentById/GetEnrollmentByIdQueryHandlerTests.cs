using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Enrollments.GetEnrollmentById;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Enrollments.GetEnrollmentById;

public class GetEnrollmentByIdQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly GetEnrollmentByIdQueryHandler _handler;

    public GetEnrollmentByIdQueryHandlerTests()
    {
        _handler = new GetEnrollmentByIdQueryHandler(_contextMock.Object);
    }

    private static (Enrollment enrollment, User student, User tutor) CreateEnrollmentWithSessions(EnrollmentStatus status = EnrollmentStatus.Active)
    {
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var subject = new Subject { Id = Guid.NewGuid(), Name = "Physics" };
        var service = new Service { Id = Guid.NewGuid(), Title = "Physics Intensive" };

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
            ServiceId = service.Id,
            Service = service,
            TotalPrice = 2_000_000m,
            TotalSessions = 2,
            SessionDurationMinutes = 90,
            TeachingMode = TeachingMode.Offline
        };

        var session1 = new Session { Id = Guid.NewGuid(), EnrollmentId = enrollment.Id, Enrollment = enrollment, SessionNumber = 1, EarningAmount = 1_000_000m };
        var session2 = new Session { Id = Guid.NewGuid(), EnrollmentId = enrollment.Id, Enrollment = enrollment, SessionNumber = 2, EarningAmount = 1_000_000m };

        enrollment.Sessions.Add(session2); // Add in reverse order to test sorting
        enrollment.Sessions.Add(session1);

        if (status == EnrollmentStatus.Cancelled)
        {
            enrollment.Cancel("Cancelled by user");
        }
        else if (status == EnrollmentStatus.Completed)
        {
            session1.Schedule(DateTime.UtcNow.AddDays(-2), DateTime.UtcNow.AddDays(-2).AddMinutes(90));
            session1.Complete();
            enrollment.RecordCompletedSession(session1.Id);

            session2.Schedule(DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(-1).AddMinutes(90));
            session2.Complete();
            enrollment.RecordCompletedSession(session2.Id);
        }

        return (enrollment, studentUser, tutorUser);
    }

    [Fact]
    public async Task Handle_AsParticipant_ReturnsFullEnrollmentWithSortedSessions()
    {
        // Arrange
        var (enrollment, student, _) = CreateEnrollmentWithSessions();
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment> { enrollment }).Object);

        var query = new GetEnrollmentByIdQuery(student.Id, UserRole.Student, enrollment.Id);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(enrollment.Id);
        result.SubjectName.Should().Be("Physics");
        result.Sessions.Should().HaveCount(2);
        result.Sessions[0].SessionNumber.Should().Be(1);
        result.Sessions[1].SessionNumber.Should().Be(2);
    }

    [Fact]
    public async Task Handle_AsAdmin_ReturnsEnrollmentDetails()
    {
        // Arrange
        var (enrollment, _, _) = CreateEnrollmentWithSessions();
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment> { enrollment }).Object);

        var adminId = Guid.NewGuid();
        var query = new GetEnrollmentByIdQuery(adminId, UserRole.Admin, enrollment.Id);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(enrollment.Id);
    }

    [Fact]
    public async Task Handle_WhenEnrollmentCancelled_StillReadableByParticipant()
    {
        // Arrange
        var (enrollment, student, _) = CreateEnrollmentWithSessions(EnrollmentStatus.Cancelled);
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment> { enrollment }).Object);

        var query = new GetEnrollmentByIdQuery(student.Id, UserRole.Student, enrollment.Id);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(EnrollmentStatus.Cancelled);
        result.CancellationReason.Should().Be("Cancelled by user");
    }

    [Fact]
    public async Task Handle_WhenEnrollmentCompleted_StillReadableByParticipant()
    {
        // Arrange
        var (enrollment, _, tutor) = CreateEnrollmentWithSessions(EnrollmentStatus.Completed);
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment> { enrollment }).Object);

        var query = new GetEnrollmentByIdQuery(tutor.Id, UserRole.Tutor, enrollment.Id);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(EnrollmentStatus.Completed);
        result.CompletedSessions.Should().Be(2);
    }

    [Fact]
    public async Task Handle_AsNonParticipant_ThrowsForbiddenException()
    {
        // Arrange
        var (enrollment, _, _) = CreateEnrollmentWithSessions();
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment> { enrollment }).Object);

        var strangerId = Guid.NewGuid();
        var query = new GetEnrollmentByIdQuery(strangerId, UserRole.Student, enrollment.Id);

        // Act
        var act = () => _handler.Handle(query, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }
}
