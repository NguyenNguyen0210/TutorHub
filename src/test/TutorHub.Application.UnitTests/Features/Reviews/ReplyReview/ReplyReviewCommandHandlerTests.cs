using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Reviews.ReplyReview;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Reviews.ReplyReview;

public class ReplyReviewCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly StubCurrentUserService _currentUser = new();
    private readonly ReplyReviewCommandHandler _handler;

    private readonly List<Review> _reviews = new();

    public ReplyReviewCommandHandlerTests()
    {
        _contextMock.Setup(c => c.Reviews).Returns(MockDbSetHelper.CreateMockDbSet(_reviews).Object);
        _handler = new ReplyReviewCommandHandler(_contextMock.Object, _currentUser);
    }

    [Fact]
    public async Task Handle_WhenReviewNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        _currentUser.Set(Guid.NewGuid(), UserRole.Tutor);
        var command = new ReplyReviewCommand(Guid.NewGuid(), "Thanks!");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenUserNotTargetTutor_ShouldThrowForbiddenException()
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
            TutorProfileId = tutorProfile.Id
        };

        // F-23: content via factory.
        var review = Review.Create(enrollment.Id, 5, null);
        review.Id = Guid.NewGuid();
        review.Enrollment = enrollment;
        _reviews.Add(review);

        var differentUserId = Guid.NewGuid();
        _currentUser.Set(differentUserId, UserRole.Tutor);
        var command = new ReplyReviewCommand(review.Id, "Thanks for the review!");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ForbiddenException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("permission"));
    }

    [Fact]
    public async Task Handle_WhenReviewIsRemoved_ShouldThrowConflictException()
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
            TutorProfileId = tutorProfile.Id
        };

        var review = Review.Create(enrollment.Id, 1, null);
        review.Id = Guid.NewGuid();
        review.Enrollment = enrollment;
        review.RemoveByAdmin("Violates policy", Guid.NewGuid());
        _reviews.Add(review);

        _currentUser.Set(tutorUser.Id, UserRole.Tutor);
        var command = new ReplyReviewCommand(review.Id, "Thanks for the review!");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("removed"));
    }

    [Fact]
    public async Task Handle_WhenValidTutorReply_ShouldSaveReplyAndReturnDto()
    {
        // Arrange
        var studentUser = new UserBuilder().WithRole(UserRole.Student).WithFullName("Alice Smith").Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfile = studentProfile,
            TutorProfile = tutorProfile,
            TutorProfileId = tutorProfile.Id
        };

        var review = Review.Create(enrollment.Id, 5, "Loved the classes!");
        review.Id = Guid.NewGuid();
        review.Enrollment = enrollment;
        _reviews.Add(review);

        _currentUser.Set(tutorUser.Id, UserRole.Tutor);
        var command = new ReplyReviewCommand(review.Id, "Thank you, Alice! Wishing you all the best.");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.TutorReply.Should().Be("Thank you, Alice! Wishing you all the best.");
        result.TutorRepliedAt.Should().NotBeNull();
        review.TutorReply.Should().Be("Thank you, Alice! Wishing you all the best.");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
