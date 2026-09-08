using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Reviews.GetTutorReviews;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Reviews.GetTutorReviews;

public class GetTutorReviewsQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly GetTutorReviewsQueryHandler _handler;

    private readonly List<Review> _reviews = new();
    private readonly List<TutorProfile> _tutorProfiles = new();

    public GetTutorReviewsQueryHandlerTests()
    {
        _contextMock.Setup(c => c.Reviews).Returns(MockDbSetHelper.CreateMockDbSet(_reviews).Object);
        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(_tutorProfiles).Object);

        _handler = new GetTutorReviewsQueryHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WhenTutorProfileNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        var query = new GetTutorReviewsQuery(Guid.NewGuid());

        // Act
        var act = () => _handler.Handle(query, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_ShouldReturnOnlyNonRemovedReviews_WithCorrectPagination()
    {
        // Arrange
        var studentUser = new UserBuilder().WithRole(UserRole.Student).WithFullName("Alice").Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorUser.Id, User = tutorUser };
        _tutorProfiles.Add(tutorProfile);

        // Review 1: Valid (F-23: content via factory).
        var enrollment1 = new Enrollment { Id = Guid.NewGuid(), StudentProfile = studentProfile, TutorProfile = tutorProfile, TutorProfileId = tutorProfile.Id };
        var review1 = Review.Create(enrollment1.Id, 5, "Best teacher ever!");
        review1.Id = Guid.NewGuid();
        review1.Enrollment = enrollment1;
        review1.CreatedAt = DateTime.UtcNow.AddDays(-2);
        _reviews.Add(review1);

        // Review 2: Removed by moderation (Should be excluded)
        var enrollment2 = new Enrollment { Id = Guid.NewGuid(), StudentProfile = studentProfile, TutorProfile = tutorProfile, TutorProfileId = tutorProfile.Id };
        var removedReview = Review.Create(enrollment2.Id, 1, "Offensive text");
        removedReview.Id = Guid.NewGuid();
        removedReview.Enrollment = enrollment2;
        removedReview.CreatedAt = DateTime.UtcNow.AddDays(-1);
        removedReview.RemoveByAdmin("Policy violation", Guid.NewGuid());
        _reviews.Add(removedReview);

        // Review 3: Valid
        var enrollment3 = new Enrollment { Id = Guid.NewGuid(), StudentProfile = studentProfile, TutorProfile = tutorProfile, TutorProfileId = tutorProfile.Id };
        var review3 = Review.Create(enrollment3.Id, 4, "Very helpful lessons.");
        review3.Id = Guid.NewGuid();
        review3.Enrollment = enrollment3;
        review3.CreatedAt = DateTime.UtcNow;
        review3.SetTutorReply("Glad to help!");
        _reviews.Add(review3);

        var query = new GetTutorReviewsQuery(tutorProfile.Id, PageNumber: 1, PageSize: 10);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.TotalCount.Should().Be(2); // Only 2 non-removed reviews
        result.Items.Should().HaveCount(2);
        result.Items.First().Comment.Should().Be("Very helpful lessons."); // Newest first
        result.Items.First().TutorReply.Should().Be("Glad to help!");
        result.Items.Last().Comment.Should().Be("Best teacher ever!");
    }
}
