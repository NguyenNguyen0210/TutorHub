using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.PauseService;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Tutors.Services.PauseService;

public class PauseServiceCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly StubCurrentUserService _currentUser = new();
    private readonly PauseServiceCommandHandler _handler;

    public PauseServiceCommandHandlerTests()
    {
        _handler = new PauseServiceCommandHandler(_contextMock.Object, _currentUser);
    }

    private static (User User, TutorProfile TutorProfile, Service Service) ArrangeService(ServiceStatus status)
    {
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
            Status = status
        };

        return (user, tutorProfile, service);
    }

    [Fact]
    public async Task Handle_PublishedService_ShouldPause()
    {
        // Arrange
        var (user, _, service) = ArrangeService(ServiceStatus.Published);

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _currentUser.Set(user.Id, UserRole.Tutor);
        var command = new PauseServiceCommand(service.Id);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(ServiceStatus.Paused.ToString());
        service.Status.Should().Be(ServiceStatus.Paused);
        service.UpdatedAt.Should().NotBeNull();

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData(ServiceStatus.Draft)]
    [InlineData(ServiceStatus.Unpublished)]
    [InlineData(ServiceStatus.Paused)]
    public async Task Handle_NonPublishedService_ShouldThrowInvalidOperationException(ServiceStatus status)
    {
        // Arrange
        var (user, _, service) = ArrangeService(status);

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);

        _currentUser.Set(user.Id, UserRole.Tutor);
        var command = new PauseServiceCommand(service.Id);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Only a published service can be paused.*");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ServiceNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service>()).Object);

        _currentUser.Set(Guid.NewGuid(), UserRole.Tutor);
        var command = new PauseServiceCommand(Guid.NewGuid());

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_NotOwner_ShouldThrowForbiddenException()
    {
        // Arrange
        var (_, _, service) = ArrangeService(ServiceStatus.Published);

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);

        _currentUser.Set(Guid.NewGuid(), UserRole.Tutor);
        var command = new PauseServiceCommand(service.Id);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }
}
