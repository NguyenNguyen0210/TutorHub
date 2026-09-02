using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Reviews.GetEnrollmentReview;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Reviews.GetEnrollmentReview;

public class GetEnrollmentReviewQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly GetEnrollmentReviewQueryHandler _handler;

    private readonly List<Enrollment> _enrollments = new();

    public GetEnrollmentReviewQueryHandlerTests()
    {
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(_enrollments).Object);
        _handler = new GetEnrollmentReviewQueryHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WhenEnrollmentNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        var query = new GetEnrollmentReviewQuery(Guid.NewGuid(), Guid.NewGuid(), UserRole.Student);

        // Act
        var act = () => _handler.Handle(query, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenUserNotParticipantOrAdmin_ShouldThrowForbiddenException()
    {
        // Arrange
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfile = studentProfile,
            TutorProfile = tutorProfile
        };
        _enrollments.Add(enrollment);

        var unrelatedUserId = Guid.NewGuid();
        var query = new GetEnrollmentReviewQuery(enrollment.Id, unrelatedUserId, UserRole.Student);

        // Act
        var act = () => _handler.Handle(query, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Handle_WhenNoReviewExistsForEnrollment_ShouldThrowNotFoundException()
    {
        // Arrange
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfile = studentProfile,
            TutorProfile = tutorProfile,
            Review = null
        };
        _enrollments.Add(enrollment);

        var query = new GetEnrollmentReviewQuery(enrollment.Id, studentUser.Id, UserRole.Student);

        // Act
        var act = () => _handler.Handle(query, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<NotFoundException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("was not found"));
    }

    [Fact]
    public async Task Handle_WhenAuthorizedStudentOrAdmin_ShouldReturnReviewDetail()
    {
        // Arrange
        var studentUser = new UserBuilder().WithRole(UserRole.Student).WithFullName("Alice").Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var review = new Review
        {
            Id = Guid.NewGuid(),
            Rating = 5,
            Comment = "Excellent!"
        };
        review.SetTutorReply("Thanks Alice!");

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfile = studentProfile,
            TutorProfile = tutorProfile,
            Review = review
        };
        review.EnrollmentId = enrollment.Id;
        review.Enrollment = enrollment;
        _enrollments.Add(enrollment);

        var query = new GetEnrollmentReviewQuery(enrollment.Id, studentUser.Id, UserRole.Student);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(review.Id);
        result.Rating.Should().Be(5);
        result.Comment.Should().Be("Excellent!");
        result.TutorReply.Should().Be("Thanks Alice!");
        result.StudentName.Should().Be("Alice");
    }
}
