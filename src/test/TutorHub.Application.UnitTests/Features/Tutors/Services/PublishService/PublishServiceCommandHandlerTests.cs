using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.PublishService;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Tutors.Services.PublishService;

public class PublishServiceCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly PublishServiceCommandHandler _handler;

    public PublishServiceCommandHandlerTests()
    {
        _handler = new PublishServiceCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_DraftService_ValidFields_ShouldPublish()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).WithStatus(AccountStatus.Active).Build();
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
            TotalSessions = 10,
            SessionDurationMinutes = 60,
            Price = 3000000m,
            TeachingMode = TeachingMode.Online,
            Status = ServiceStatus.Draft
        };

        var approvedApp = new TutorApplication { Id = Guid.NewGuid(), UserId = user.Id };
        approvedApp.Approve(Guid.NewGuid());

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication> { approvedApp }).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new PublishServiceCommand(service.Id, user.Id);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(ServiceStatus.Published.ToString());
        service.Status.Should().Be(ServiceStatus.Published);
        service.UpdatedAt.Should().NotBeNull();

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ServiceNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service>()).Object);

        var command = new PublishServiceCommand(Guid.NewGuid(), Guid.NewGuid());

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_NotOwner_ShouldThrowForbiddenException()
    {
        // Arrange
        var ownerUser = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = ownerUser.Id, User = ownerUser };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            Title = "Title",
            Description = "Desc",
            TotalSessions = 5,
            SessionDurationMinutes = 60,
            Price = 1000000m,
            Status = ServiceStatus.Draft
        };

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);

        var differentUserId = Guid.NewGuid();
        var command = new PublishServiceCommand(service.Id, differentUserId);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ForbiddenException>();
        ex.Which.Errors.Should().Contain("You do not have permission to publish this service.");
    }

    [Fact]
    public async Task Handle_UserNotActive_ShouldThrowForbiddenException()
    {
        // Arrange
        var suspendedUser = new UserBuilder().WithRole(UserRole.Tutor).WithStatus(AccountStatus.Suspended).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = suspendedUser.Id, User = suspendedUser };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            Title = "Title",
            Description = "Desc",
            TotalSessions = 5,
            SessionDurationMinutes = 60,
            Price = 1000000m,
            Status = ServiceStatus.Draft
        };

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);

        var command = new PublishServiceCommand(service.Id, suspendedUser.Id);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ForbiddenException>();
        ex.Which.Errors.Should().Contain("Your user account is not active.");
    }

    [Fact]
    public async Task Handle_TutorNotApproved_ShouldThrowForbiddenException()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).WithStatus(AccountStatus.Active).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            Title = "Title",
            Description = "Desc",
            TotalSessions = 5,
            SessionDurationMinutes = 60,
            Price = 1000000m,
            Status = ServiceStatus.Draft
        };

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication>()).Object);

        var command = new PublishServiceCommand(service.Id, user.Id);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ForbiddenException>();
        ex.Which.Errors.Should().Contain("Only approved tutors can publish services.");
    }

    [Fact]
    public async Task Handle_AlreadyPublished_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).WithStatus(AccountStatus.Active).Build();
        var tutorProfile = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            Title = "Title",
            Description = "Desc",
            TotalSessions = 5,
            SessionDurationMinutes = 60,
            Price = 1000000m,
            Status = ServiceStatus.Published
        };

        var approvedApp = new TutorApplication { Id = Guid.NewGuid(), UserId = user.Id };
        approvedApp.Approve(Guid.NewGuid());

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication> { approvedApp }).Object);

        var command = new PublishServiceCommand(service.Id, user.Id);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Service is already published.");
    }
}
