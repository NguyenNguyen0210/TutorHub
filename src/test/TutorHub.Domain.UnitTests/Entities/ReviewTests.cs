using FluentAssertions;
using TutorHub.Domain.Entities;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class ReviewTests
{
    [Fact]
    public void SetTutorReply_WhenValidReply_ShouldSetTutorReplyAndTimestamp()
    {
        // Arrange
        var review = new Review
        {
            Id = Guid.NewGuid(),
            EnrollmentId = Guid.NewGuid(),
            Rating = 5,
            Comment = "Excellent tutor, explains concepts very clearly."
        };

        // Act
        review.SetTutorReply("Thank you for your feedback! It was great working with you.");

        // Assert
        review.TutorReply.Should().Be("Thank you for your feedback! It was great working with you.");
        review.TutorRepliedAt.Should().NotBeNull();
        review.TutorRepliedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void SetTutorReply_WhenEmptyOrWhitespace_ShouldThrowArgumentException(string? invalidReply)
    {
        // Arrange
        var review = new Review
        {
            Id = Guid.NewGuid(),
            EnrollmentId = Guid.NewGuid(),
            Rating = 4
        };

        // Act
        var act = () => review.SetTutorReply(invalidReply!);

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*cannot be empty*");
    }

    [Fact]
    public void SetTutorReply_WhenReviewIsRemoved_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var review = new Review
        {
            Id = Guid.NewGuid(),
            EnrollmentId = Guid.NewGuid(),
            Rating = 1
        };
        review.RemoveByAdmin("Inappropriate content", Guid.NewGuid());

        // Act
        var act = () => review.SetTutorReply("Valid reply text");

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot reply to a removed review.");
    }

    [Fact]
    public void RemoveByAdmin_WhenValidReason_ShouldSetRemovalMetadataAndIsRemoved()
    {
        // Arrange
        var review = new Review
        {
            Id = Guid.NewGuid(),
            EnrollmentId = Guid.NewGuid(),
            Rating = 1,
            Comment = "Spam review"
        };
        var adminId = Guid.NewGuid();

        // Act
        review.RemoveByAdmin("Violates terms of service - spam", adminId);

        // Assert
        review.IsRemoved.Should().BeTrue();
        review.RemovalReason.Should().Be("Violates terms of service - spam");
        review.RemovedByAdminId.Should().Be(adminId);
        review.RemovedAt.Should().NotBeNull();
        review.RemovedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void RemoveByAdmin_WhenEmptyReason_ShouldThrowArgumentException(string? invalidReason)
    {
        // Arrange
        var review = new Review
        {
            Id = Guid.NewGuid(),
            EnrollmentId = Guid.NewGuid(),
            Rating = 3
        };

        // Act
        var act = () => review.RemoveByAdmin(invalidReason!, Guid.NewGuid());

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*Removal reason is required*");
    }

    [Fact]
    public void RemoveByAdmin_WhenAlreadyRemoved_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var review = new Review
        {
            Id = Guid.NewGuid(),
            EnrollmentId = Guid.NewGuid(),
            Rating = 2
        };
        var adminId = Guid.NewGuid();
        review.RemoveByAdmin("First removal", adminId);

        // Act
        var act = () => review.RemoveByAdmin("Second removal", adminId);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Review is already removed.");
    }
}
