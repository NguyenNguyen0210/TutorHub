using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Reviews.CreateEnrollmentReview;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Reviews.CreateEnrollmentReview;

public class CreateEnrollmentReviewCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly CreateEnrollmentReviewCommandHandler _handler;

    private readonly List<Enrollment> _enrollments = new();
    private readonly List<Review> _reviews = new();
    private readonly List<TutorProfile> _tutorProfiles = new();

    public CreateEnrollmentReviewCommandHandlerTests()
    {
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(_enrollments).Object);
        _contextMock.Setup(c => c.Reviews).Returns(MockDbSetHelper.CreateMockDbSet(_reviews).Object);
        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(_tutorProfiles).Object);

        _handler = new CreateEnrollmentReviewCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WhenEnrollmentNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        var command = new CreateEnrollmentReviewCommand(Guid.NewGuid(), Guid.NewGuid(), 5, "Great lesson!");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenUserNotStudentOfEnrollment_ShouldThrowForbiddenException()
    {
        // Arrange
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            TotalSessions = 1
        };
        _enrollments.Add(enrollment);

        var differentUserId = Guid.NewGuid();
        var command = new CreateEnrollmentReviewCommand(enrollment.Id, differentUserId, 5, "Great lesson!");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ForbiddenException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("Only the student enrolled"));
    }

    [Fact]
    public async Task Handle_WhenEnrollmentNotCompleted_ShouldThrowConflictException()
    {
        // Arrange
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            TotalSessions = 2
        }; // Status defaults to Active
        _enrollments.Add(enrollment);

        var command = new CreateEnrollmentReviewCommand(enrollment.Id, studentUser.Id, 5, "Great lesson!");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("completed enrollments"));
    }

    [Fact]
    public async Task Handle_WhenReviewWindowHasExpired_ShouldThrowConflictException()
    {
        // Arrange
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            TotalSessions = 1
        };

        var session = new Session { Id = Guid.NewGuid(), EnrollmentId = enrollment.Id, SessionNumber = 1 };
        session.Schedule(DateTime.UtcNow.AddDays(-40), DateTime.UtcNow.AddDays(-40).AddHours(1));
        session.Complete();
        enrollment.Sessions.Add(session);
        enrollment.RecordCompletedSession(session.Id); // Sets CompletedAt = UtcNow

        // Simulate that the enrollment completed 35 days ago (Review window > 30 days)
        typeof(Enrollment).GetProperty(nameof(Enrollment.CompletedAt))!
            .SetValue(enrollment, DateTime.UtcNow.AddDays(-35));

        _enrollments.Add(enrollment);

        var command = new CreateEnrollmentReviewCommand(enrollment.Id, studentUser.Id, 5, "Late review attempt");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("review window for this completed enrollment has expired"));
    }

    [Fact]
    public async Task Handle_WhenReviewAlreadyExistsForEnrollment_ShouldThrowConflictException()
    {
        // Arrange
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            TotalSessions = 1
        };

        var session = new Session { Id = Guid.NewGuid(), EnrollmentId = enrollment.Id, SessionNumber = 1 };
        session.Schedule(DateTime.UtcNow.AddHours(-2), DateTime.UtcNow.AddHours(-1));
        session.Complete();
        enrollment.Sessions.Add(session);
        enrollment.RecordCompletedSession(session.Id); // Transitions to Completed
        _enrollments.Add(enrollment);

        _reviews.Add(new Review
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Rating = 5,
            Comment = "Existing review"
        });

        var command = new CreateEnrollmentReviewCommand(enrollment.Id, studentUser.Id, 4, "Second review attempt");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("already been submitted"));
    }

    [Fact]
    public async Task Handle_WhenValidReview_ShouldCreateReviewAndRecalculateTutorRating()
    {
        // Arrange
        var studentUser = new UserBuilder().WithRole(UserRole.Student).WithFullName("Alice Smith").Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = tutorUser.Id,
            User = tutorUser,
            RatingAvg = 4.0m,
            TotalReviews = 1
        };
        _tutorProfiles.Add(tutorProfile);

        // An existing previous review for another completed enrollment of the same tutor
        var prevEnrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            StudentProfileId = Guid.NewGuid()
        };
        _enrollments.Add(prevEnrollment);

        _reviews.Add(new Review
        {
            Id = Guid.NewGuid(),
            EnrollmentId = prevEnrollment.Id,
            Enrollment = prevEnrollment,
            Rating = 4
        });

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            TotalSessions = 1
        };

        var session = new Session { Id = Guid.NewGuid(), EnrollmentId = enrollment.Id, SessionNumber = 1 };
        session.Schedule(DateTime.UtcNow.AddHours(-2), DateTime.UtcNow.AddHours(-1));
        session.Complete();
        enrollment.Sessions.Add(session);
        enrollment.RecordCompletedSession(session.Id);
        _enrollments.Add(enrollment);

        var command = new CreateEnrollmentReviewCommand(enrollment.Id, studentUser.Id, 5, "Outstanding teaching!");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.EnrollmentId.Should().Be(enrollment.Id);
        result.Rating.Should().Be(5);
        result.Comment.Should().Be("Outstanding teaching!");
        result.StudentName.Should().Be("Alice Smith");
        result.IsRemoved.Should().BeFalse();

        _reviews.Should().HaveCount(2);
        tutorProfile.TotalReviews.Should().Be(2);
        tutorProfile.RatingAvg.Should().Be(4.5m); // (4 + 5) / 2 = 4.50

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
