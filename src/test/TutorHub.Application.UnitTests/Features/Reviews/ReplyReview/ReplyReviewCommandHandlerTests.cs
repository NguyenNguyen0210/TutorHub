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
    private readonly ReplyReviewCommandHandler _handler;

    private readonly List<Review> _reviews = new();

    public ReplyReviewCommandHandlerTests()
    {
        _contextMock.Setup(c => c.Reviews).Returns(MockDbSetHelper.CreateMockDbSet(_reviews).Object);
        _handler = new ReplyReviewCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WhenReviewNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        var command = new ReplyReviewCommand(Guid.NewGuid(), Guid.NewGuid(), "Thanks!");

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

        var review = new Review
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            Rating = 5
        };
        _reviews.Add(review);

        var differentUserId = Guid.NewGuid();
        var command = new ReplyReviewCommand(review.Id, differentUserId, "Thanks for the review!");

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

        var review = new Review
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            Rating = 1
        };
        review.RemoveByAdmin("Violates policy", Guid.NewGuid());
        _reviews.Add(review);

        var command = new ReplyReviewCommand(review.Id, tutorUser.Id, "Thanks for the review!");

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

        var review = new Review
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            Rating = 5,
            Comment = "Loved the classes!"
        };
        _reviews.Add(review);

        var command = new ReplyReviewCommand(review.Id, tutorUser.Id, "Thank you, Alice! Wishing you all the best.");

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
