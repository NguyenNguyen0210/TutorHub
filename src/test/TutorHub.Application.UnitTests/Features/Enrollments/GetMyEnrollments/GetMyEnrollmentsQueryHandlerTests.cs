using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Enrollments.GetMyEnrollments;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Enrollments.GetMyEnrollments;

public class GetMyEnrollmentsQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly GetMyEnrollmentsQueryHandler _handler;

    public GetMyEnrollmentsQueryHandlerTests()
    {
        _handler = new GetMyEnrollmentsQueryHandler(_contextMock.Object);
    }

    private static (Enrollment enrollment, User student, User tutor) CreateEnrollmentWithSessions(
        int totalSessions = 3,
        int completedSessions = 1,
        EnrollmentStatus status = EnrollmentStatus.Active)
    {
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var subject = new Subject { Id = Guid.NewGuid(), Name = "Mathematics" };
        var service = new Service { Id = Guid.NewGuid(), Title = "Math Masterclass" };

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
            TotalPrice = 1_500_000m,
            TotalSessions = totalSessions,
            SessionDurationMinutes = 60,
            TeachingMode = TeachingMode.Online
        };

        for (int i = 1; i <= totalSessions; i++)
        {
            var session = new Session
            {
                Id = Guid.NewGuid(),
                EnrollmentId = enrollment.Id,
                Enrollment = enrollment,
                SessionNumber = i,
                EarningAmount = 500_000m
            };

            if (i <= completedSessions)
            {
                session.Schedule(DateTime.UtcNow.AddDays(-i), DateTime.UtcNow.AddDays(-i).AddHours(1));
                session.Complete();
            }

            enrollment.Sessions.Add(session);
        }

        if (status == EnrollmentStatus.Cancelled)
        {
            enrollment.Cancel("Cancelled");
        }

        return (enrollment, studentUser, tutorUser);
    }

    [Fact]
    public async Task Handle_AsStudent_ReturnsStudentEnrollmentsWithAccurateCompletedCountAndTotalCount()
    {
        // Arrange
        var (enrollment1, student, _) = CreateEnrollmentWithSessions(3, 2);
        var (enrollment2, _, _) = CreateEnrollmentWithSessions(5, 0); // other student

        var enrollments = new List<Enrollment> { enrollment1, enrollment2 };
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(enrollments).Object);

        var query = new GetMyEnrollmentsQuery(student.Id, UserRole.Student, null, 1, 10);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.TotalCount.Should().Be(1);
        result.Items.Should().HaveCount(1);
        result.Items[0].Id.Should().Be(enrollment1.Id);
        result.Items[0].TotalSessions.Should().Be(3);
        result.Items[0].CompletedSessions.Should().Be(2); // Accurate SQL COUNT
        result.Items[0].StudentName.Should().Be(student.FullName);
    }

    [Fact]
    public async Task Handle_AsTutor_ReturnsTutorEnrollments()
    {
        // Arrange
        var (enrollment1, _, tutor) = CreateEnrollmentWithSessions(3, 1);
        var (enrollment2, _, otherTutor) = CreateEnrollmentWithSessions(5, 0);

        var enrollments = new List<Enrollment> { enrollment1, enrollment2 };
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(enrollments).Object);

        var query = new GetMyEnrollmentsQuery(tutor.Id, UserRole.Tutor, null, 1, 10);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.TotalCount.Should().Be(1);
        result.Items[0].Id.Should().Be(enrollment1.Id);
        result.Items[0].TutorName.Should().Be(tutor.FullName);
    }

    [Fact]
    public async Task Handle_WithStatusFilter_ReturnsFilteredEnrollments()
    {
        // Arrange
        var (enrollmentActive, student, _) = CreateEnrollmentWithSessions(3, 1, EnrollmentStatus.Active);
        var (enrollmentCancelled, _, _) = CreateEnrollmentWithSessions(3, 1, EnrollmentStatus.Cancelled);
        enrollmentCancelled.StudentProfileId = enrollmentActive.StudentProfileId;
        enrollmentCancelled.StudentProfile = enrollmentActive.StudentProfile;

        var enrollments = new List<Enrollment> { enrollmentActive, enrollmentCancelled };
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(enrollments).Object);

        var query = new GetMyEnrollmentsQuery(student.Id, UserRole.Student, EnrollmentStatus.Cancelled, 1, 10);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.TotalCount.Should().Be(1);
        result.Items[0].Id.Should().Be(enrollmentCancelled.Id);
        result.Items[0].Status.Should().Be(EnrollmentStatus.Cancelled);
    }

    [Fact]
    public async Task Handle_WithPagination_ReturnsCorrectPageAndTotalCount()
    {
        // Arrange
        var (e1, student, _) = CreateEnrollmentWithSessions(3, 0);
        var (e2, _, _) = CreateEnrollmentWithSessions(3, 0);
        var (e3, _, _) = CreateEnrollmentWithSessions(3, 0);

        e2.StudentProfileId = e1.StudentProfileId; e2.StudentProfile = e1.StudentProfile;
        e3.StudentProfileId = e1.StudentProfileId; e3.StudentProfile = e1.StudentProfile;

        var enrollments = new List<Enrollment> { e1, e2, e3 };
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(enrollments).Object);

        var query = new GetMyEnrollmentsQuery(student.Id, UserRole.Student, null, 2, 2);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.TotalCount.Should().Be(3);
        result.PageNumber.Should().Be(2);
        result.PageSize.Should().Be(2);
        result.Items.Should().HaveCount(1);
    }
}
