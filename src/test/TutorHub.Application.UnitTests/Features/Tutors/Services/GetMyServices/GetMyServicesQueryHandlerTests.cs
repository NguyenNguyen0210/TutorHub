using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.GetMyServices;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Tutors.Services.GetMyServices;

public class GetMyServicesQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly StubCurrentUserService _currentUser = new();
    private readonly GetMyServicesQueryHandler _handler;

    public GetMyServicesQueryHandlerTests()
    {
        _handler = new GetMyServicesQueryHandler(_contextMock.Object, _currentUser);
    }

    [Fact]
    public async Task Handle_MultipleServices_ShouldPopulatePerServiceStats()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };
        var category = new Category { Id = Guid.NewGuid(), Name = "Mathematics" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Algebra", CategoryId = category.Id, Category = category };

        Service BuildService(string title) => new()
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            SubjectId = subject.Id,
            Subject = subject,
            Title = title,
            Description = "Desc",
            TotalSessions = 10,
            SessionDurationMinutes = 60,
            Price = 3000000m,
            TeachingMode = TeachingMode.Online,
            Status = ServiceStatus.Published,
            CreatedAt = DateTime.UtcNow
        };

        var serviceA = BuildService("Service A");
        var serviceB = BuildService("Service B");

        var studentA = Guid.NewGuid();
        var studentB = Guid.NewGuid();
        var enrollmentA1 = new Enrollment { Id = Guid.NewGuid(), ServiceId = serviceA.Id, StudentProfileId = studentA };
        var enrollmentA2 = new Enrollment { Id = Guid.NewGuid(), ServiceId = serviceA.Id, StudentProfileId = studentB };

        var reviewA1 = Review.Create(enrollmentA1.Id, 5, "Great!");
        reviewA1.Enrollment = enrollmentA1;
        var reviewA2 = Review.Create(enrollmentA2.Id, 4, "Nice.");
        reviewA2.Enrollment = enrollmentA2;

        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile> { tutorProfile }).Object);
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { serviceA, serviceB }).Object);
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment> { enrollmentA1, enrollmentA2 }).Object);
        _contextMock.Setup(c => c.Reviews).Returns(MockDbSetHelper.CreateMockDbSet(new List<Review> { reviewA1, reviewA2 }).Object);

        _currentUser.Set(user.Id, UserRole.Tutor);

        // Act
        var result = await _handler.Handle(new GetMyServicesQuery(), CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);

        var dtoA = result.Single(d => d.Id == serviceA.Id);
        dtoA.StudentCount.Should().Be(2);
        dtoA.ReviewCount.Should().Be(2);
        dtoA.AverageRating.Should().Be(4.5);

        var dtoB = result.Single(d => d.Id == serviceB.Id);
        dtoB.StudentCount.Should().Be(0);
        dtoB.ReviewCount.Should().Be(0);
        dtoB.AverageRating.Should().BeNull();
    }
}
