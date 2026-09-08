using FluentAssertions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class ServiceTests
{
    [Fact]
    public void NewService_ShouldDefaultToDraftStatus()
    {
        // Act
        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = Guid.NewGuid(),
            SubjectId = Guid.NewGuid(),
            Title = "Math tutoring package",
            Description = "10 comprehensive lessons",
            TotalSessions = 10,
            SessionDurationMinutes = 60,
            Price = 3500000m,
            TeachingMode = TeachingMode.Online
        };

        // Assert
        service.Status.Should().Be(ServiceStatus.Draft);
        service.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
        service.UpdatedAt.Should().BeNull();
    }

    [Fact]
    public void Publish_FromDraft_ShouldTransitionToPublished()
    {
        // Arrange
        var service = new Service
        {
            Status = ServiceStatus.Draft
        };

        // Act
        service.Publish();

        // Assert
        service.Status.Should().Be(ServiceStatus.Published);
        service.UpdatedAt.Should().NotBeNull();
        service.UpdatedAt.Value.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
    }

    [Fact]
    public void Publish_FromUnpublished_ShouldTransitionToPublished()
    {
        // Arrange
        var service = new Service
        {
            Status = ServiceStatus.Unpublished
        };

        // Act
        service.Publish();

        // Assert
        service.Status.Should().Be(ServiceStatus.Published);
        service.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public void Publish_WhenAlreadyPublished_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var service = new Service
        {
            Status = ServiceStatus.Published
        };

        // Act
        var act = () => service.Publish();

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Service is already published.");
    }

    [Fact]
    public void Unpublish_FromPublished_ShouldTransitionToUnpublished()
    {
        // Arrange
        var service = new Service
        {
            Status = ServiceStatus.Published
        };

        // Act
        service.Unpublish();

        // Assert
        service.Status.Should().Be(ServiceStatus.Unpublished);
        service.UpdatedAt.Should().NotBeNull();
        service.UpdatedAt.Value.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
    }

    [Fact]
    public void Unpublish_FromDraft_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var service = new Service
        {
            Status = ServiceStatus.Draft
        };

        // Act
        var act = () => service.Unpublish();

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Draft service cannot be unpublished.");
    }

    [Fact]
    public void Unpublish_WhenAlreadyUnpublished_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var service = new Service
        {
            Status = ServiceStatus.Unpublished
        };

        // Act
        var act = () => service.Unpublish();

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Service is already unpublished.");
    }
}
