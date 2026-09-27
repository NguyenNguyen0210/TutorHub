using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.GetMyServiceById;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Tutors.Services.GetMyServiceById;

public class GetMyServiceByIdQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly StubCurrentUserService _currentUser = new();
    private readonly GetMyServiceByIdQueryHandler _handler;

    public GetMyServiceByIdQueryHandlerTests()
    {
        _handler = new GetMyServiceByIdQueryHandler(_contextMock.Object, _currentUser);
    }

    [Fact]
    public async Task Handle_ServiceWithEnrollmentsAndReviews_ShouldPopulateStats()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };
        var category = new Category { Id = Guid.NewGuid(), Name = "Mathematics" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Algebra", CategoryId = category.Id, Category = category };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = subject.Id,
            Subject = subject,
            Title = "Algebra Masterclass",
            Description = "Full comprehensive course",
            ShortDescription = "Short",
            TagsJson = "[\"algebra\",\"exam\"]",
            TotalSessions = 10,
            SessionDurationMinutes = 60,
            Price = 3000000m,
            TeachingMode = TeachingMode.Online,
            CoverImageUrl = "https://example.com/cover.png",
            Status = ServiceStatus.Published
        };

        // Two distinct students; one enrolled twice (duplicate must not double-count).
        var studentA = Guid.NewGuid();
        var studentB = Guid.NewGuid();
        var enrollments = new List<Enrollment>
        {
            new() { Id = Guid.NewGuid(), ServiceId = service.Id, StudentProfileId = studentA },
            new() { Id = Guid.NewGuid(), ServiceId = service.Id, StudentProfileId = studentA },
            new() { Id = Guid.NewGuid(), ServiceId = service.Id, StudentProfileId = studentB },
            new() { Id = Guid.NewGuid(), ServiceId = Guid.NewGuid(), StudentProfileId = Guid.NewGuid() }
        };

        var review1 = Review.Create(enrollments[0].Id, 5, "Excellent!");
        review1.Enrollment = enrollments[0];
        var review2 = Review.Create(enrollments[2].Id, 3, "Good.");
        review2.Enrollment = enrollments[2];
        var removedReview = Review.Create(enrollments[2].Id, 1, "Bad.");
        removedReview.Enrollment = enrollments[2];
        removedReview.RemoveByAdmin("Spam", Guid.NewGuid());

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(enrollments).Object);
        _contextMock.Setup(c => c.Reviews).Returns(MockDbSetHelper.CreateMockDbSet(new List<Review> { review1, review2, removedReview }).Object);

        _currentUser.Set(user.Id, UserRole.Tutor);

        // Act
        var result = await _handler.Handle(new GetMyServiceByIdQuery(service.Id), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.ShortDescription.Should().Be("Short");
        result.Tags.Should().BeEquivalentTo("algebra", "exam");
        result.CoverImageUrl.Should().Be("https://example.com/cover.png");
        result.StudentCount.Should().Be(2);
        result.ReviewCount.Should().Be(2);
        result.AverageRating.Should().Be(4.0);
    }

    [Fact]
    public async Task Handle_ServiceWithoutEngagement_ShouldReturnZeroStatsAndNullRating()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };
        var category = new Category { Id = Guid.NewGuid(), Name = "Mathematics" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Algebra", CategoryId = category.Id, Category = category };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = subject.Id,
            Subject = subject,
            Title = "New Service",
            Description = "No students yet",
            TotalSessions = 5,
            SessionDurationMinutes = 60,
            Price = 1000000m,
            TeachingMode = TeachingMode.Online,
            Status = ServiceStatus.Draft
        };

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment>()).Object);
        _contextMock.Setup(c => c.Reviews).Returns(MockDbSetHelper.CreateMockDbSet(new List<Review>()).Object);

        _currentUser.Set(user.Id, UserRole.Tutor);

        // Act
        var result = await _handler.Handle(new GetMyServiceByIdQuery(service.Id), CancellationToken.None);

        // Assert
        result.StudentCount.Should().Be(0);
        result.ReviewCount.Should().Be(0);
        result.AverageRating.Should().BeNull();
        result.Tags.Should().BeEmpty();
    }
}
