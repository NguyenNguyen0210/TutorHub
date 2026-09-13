using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Reviews.AdminModerateReview;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Reviews.AdminModerateReview;

public class AdminModerateReviewCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly StubCurrentUserService _currentUser = new();
    private readonly AdminModerateReviewCommandHandler _handler;

    private readonly List<Review> _reviews = new();
    private readonly List<TutorProfile> _tutorProfiles = new();
    private readonly List<Enrollment> _enrollments = new();

    public AdminModerateReviewCommandHandlerTests()
    {
        _contextMock.Setup(c => c.Reviews).Returns(MockDbSetHelper.CreateMockDbSet(_reviews).Object);
        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(_tutorProfiles).Object);
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(_enrollments).Object);

        _handler = new AdminModerateReviewCommandHandler(_contextMock.Object, _currentUser);
    }

    [Fact]
    public async Task Handle_WhenReviewNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        _currentUser.Set(Guid.NewGuid(), UserRole.Admin);
        var command = new AdminModerateReviewCommand(Guid.NewGuid(), "Violates policy");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenReviewAlreadyRemoved_ShouldThrowConflictException()
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
        _enrollments.Add(enrollment);

        // F-23: content set via factory; moderation via domain method.
        var review = Review.Create(enrollment.Id, 1, null);
        review.Id = Guid.NewGuid();
        review.Enrollment = enrollment;
        review.RemoveByAdmin("Already removed reason", Guid.NewGuid());
        _reviews.Add(review);

        _currentUser.Set(Guid.NewGuid(), UserRole.Admin);
        var command = new AdminModerateReviewCommand(review.Id, "Second removal attempt");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("already been removed"));
    }

    [Fact]
    public async Task Handle_WhenValidAdmin_ShouldMarkRemovedAndRecalculateTutorRating()
    {
        // Arrange
        var studentUser = new UserBuilder().WithRole(UserRole.Student).WithFullName("Bob Green").Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = tutorUser.Id,
            User = tutorUser
        };
        // F-23: stats owned by domain (prior ratings 5 + 1 → avg 3.0 x2).
        tutorProfile.ApplyReview(new List<int> { 5, 1 });
        _tutorProfiles.Add(tutorProfile);

        // Review 1: Rating 5 (Valid, will remain)
        var enrollment1 = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfile = studentProfile,
            TutorProfile = tutorProfile,
            TutorProfileId = tutorProfile.Id
        };
        _enrollments.Add(enrollment1);
        var review1 = Review.Create(enrollment1.Id, 5, null);
        review1.Id = Guid.NewGuid();
        review1.Enrollment = enrollment1;
        _reviews.Add(review1);

        // Review 2: Rating 1 (To be removed by moderation)
        var enrollment2 = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfile = studentProfile,
            TutorProfile = tutorProfile,
            TutorProfileId = tutorProfile.Id
        };
        _enrollments.Add(enrollment2);
        var review2 = Review.Create(enrollment2.Id, 1, null);
        review2.Id = Guid.NewGuid();
        review2.Enrollment = enrollment2;
        _reviews.Add(review2);

        var adminId = Guid.NewGuid();
        _currentUser.Set(adminId, UserRole.Admin);
        var command = new AdminModerateReviewCommand(review2.Id, "Profanity in review text");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsRemoved.Should().BeTrue();
        review2.IsRemoved.Should().BeTrue();
        review2.RemovalReason.Should().Be("Profanity in review text");
        review2.RemovedByAdminId.Should().Be(adminId);

        // Recalculated Tutor Profile: Only review1 (Rating 5) remains
        tutorProfile.TotalReviews.Should().Be(1);
        tutorProfile.RatingAvg.Should().Be(5.0m);

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
