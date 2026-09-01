using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.UpdateService;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Tutors.Services.UpdateService;

public class UpdateServiceCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly UpdateServiceCommandHandler _handler;

    public UpdateServiceCommandHandlerTests()
    {
        _handler = new UpdateServiceCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_DraftService_ShouldUpdateAllFields()
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
            Title = "Old Title",
            Description = "Old Desc",
            TotalSessions = 5,
            SessionDurationMinutes = 45,
            Price = 1500000m,
            TeachingMode = TeachingMode.Online,
            Status = ServiceStatus.Draft
        };

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new UpdateServiceCommand(
            ServiceId: service.Id,
            UserId: user.Id,
            Title: "New Title",
            Description: "New Description",
            LearningScope: "Scope",
            ExpectedOutcome: "Outcome",
            TotalSessions: 10,
            SessionDurationMinutes: 60,
            Price: 3000000m,
            TeachingMode: TeachingMode.Both,
            TrialLessonUrl: "https://example.com/trial"
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("New Title");
        result.TotalSessions.Should().Be(10);
        result.SessionDurationMinutes.Should().Be(60);
        result.Price.Should().Be(3000000m);
        result.TeachingMode.Should().Be("Both");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_PublishedService_ShouldUpdateNonCommercialFields()
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
            Title = "Old Title",
            Description = "Old Desc",
            TotalSessions = 10,
            SessionDurationMinutes = 60,
            Price = 3000000m,
            TeachingMode = TeachingMode.Online,
            Status = ServiceStatus.Published
        };

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new UpdateServiceCommand(
            ServiceId: service.Id,
            UserId: user.Id,
            Title: "Updated Published Title",
            Description: "Updated Published Description",
            LearningScope: "Updated Scope",
            ExpectedOutcome: "Updated Outcome",
            TotalSessions: null,
            SessionDurationMinutes: null,
            Price: null,
            TeachingMode: null,
            TrialLessonUrl: null
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Updated Published Title");
        result.Description.Should().Be("Updated Published Description");
        result.Price.Should().Be(3000000m);

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_PublishedService_ChangingPrice_ShouldThrowConflictException()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            Title = "Title",
            Description = "Desc",
            TotalSessions = 10,
            SessionDurationMinutes = 60,
            Price = 3000000m,
            TeachingMode = TeachingMode.Online,
            Status = ServiceStatus.Published
        };

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);

        var command = new UpdateServiceCommand(
            ServiceId: service.Id,
            UserId: user.Id,
            Title: null,
            Description: null,
            LearningScope: null,
            ExpectedOutcome: null,
            TotalSessions: null,
            SessionDurationMinutes: null,
            Price: 4000000m, // Changed price
            TeachingMode: null,
            TrialLessonUrl: null
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().ContainMatch("*Cannot modify commercial terms*");
    }

    [Fact]
    public async Task Handle_NotOwner_ShouldThrowForbiddenException()
    {
        // Arrange
        var owner = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = owner.Id, User = owner };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            Title = "Title",
            Description = "Desc",
            Status = ServiceStatus.Draft
        };

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);

        var differentUserId = Guid.NewGuid();
        var command = new UpdateServiceCommand(
            ServiceId: service.Id,
            UserId: differentUserId,
            Title: "New Title",
            Description: null,
            LearningScope: null,
            ExpectedOutcome: null,
            TotalSessions: null,
            SessionDurationMinutes: null,
            Price: null,
            TeachingMode: null,
            TrialLessonUrl: null
        );

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }
}
