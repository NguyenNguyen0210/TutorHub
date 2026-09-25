using FluentAssertions;
using MockQueryable.Moq;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Services.GetServiceDetail;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Services;

public class GetServiceDetailQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly GetServiceDetailQueryHandler _handler;

    public GetServiceDetailQueryHandlerTests()
    {
        _handler = new GetServiceDetailQueryHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_ExistingPublishedService_ShouldReturnCompleteDetails()
    {
        // Arrange
        var user = new UserBuilder()
            .WithRole(UserRole.Tutor)
            .WithStatus(AccountStatus.Active)
            .Build();

        var app = new TutorApplication
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Bio = "Bio",
            Education = "Edu",
            ExperienceYears = 5,
            TeachingMode = TeachingMode.Both,
            SubmittedAt = DateTime.UtcNow
        };
        app.Approve(Guid.NewGuid());
        user.TutorApplications.Add(app);

        var tutorProfile = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Bio = "Experienced Math Tutor",
            Education = "Bachelor of Mathematics",
            ExperienceYears = 5
        };

        var category = new Category { Id = Guid.NewGuid(), Name = "Mathematics" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Algebra 10", CategoryId = category.Id, Category = category };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = subject.Id,
            Subject = subject,
            Title = "Master Algebra 10",
            Description = "Comprehensive course covering all algebra fundamentals.",
            LearningScope = "High school algebra syllabus",
            ExpectedOutcome = "Score 8+ in midterm and final tests",
            TotalSessions = 10,
            SessionDurationMinutes = 90,
            Price = 2000000m,
            TeachingMode = TeachingMode.Both,
            Status = ServiceStatus.Published,
            CreatedAt = DateTime.UtcNow
        };

        _contextMock.Setup(c => c.Services).Returns(new List<Service> { service }.BuildMockDbSet().Object);
        _contextMock.Setup(c => c.Enrollments).Returns(new List<Enrollment>().BuildMockDbSet().Object);
        _contextMock.Setup(c => c.Reviews).Returns(new List<Review>().BuildMockDbSet().Object);

        // Act
        var result = await _handler.Handle(new GetServiceDetailQuery(service.Id), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(service.Id);
        result.Title.Should().Be("Master Algebra 10");
        result.Price.Should().Be(2000000m);
        result.PricePerSession.Should().Be(200000m);
        result.TotalSessions.Should().Be(10);
        result.Curriculum.Should().HaveCount(10);
        result.Tutor.FullName.Should().Be(user.FullName);
        result.Subject.Name.Should().Be("Algebra 10");
    }

    [Fact]
    public async Task Handle_NonExistentService_ShouldThrowNotFoundException()
    {
        // Arrange
        _contextMock.Setup(c => c.Services).Returns(new List<Service>().BuildMockDbSet().Object);

        // Act
        var act = () => _handler.Handle(new GetServiceDetailQuery(Guid.NewGuid()), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_DraftService_WhenRequestedByAnonymous_ShouldThrowNotFoundException()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).WithStatus(AccountStatus.Active).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };
        var category = new Category { Id = Guid.NewGuid(), Name = "Physics" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Physics 11", CategoryId = category.Id, Category = category };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = subject.Id,
            Subject = subject,
            Title = "Draft Physics Course",
            Description = "Work in progress",
            TotalSessions = 6,
            SessionDurationMinutes = 60,
            Price = 1500000m,
            TeachingMode = TeachingMode.Online,
            Status = ServiceStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };

        _contextMock.Setup(c => c.Services).Returns(new List<Service> { service }.BuildMockDbSet().Object);

        // Act
        var act = () => _handler.Handle(new GetServiceDetailQuery(service.Id, CurrentUserId: null), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }
}
