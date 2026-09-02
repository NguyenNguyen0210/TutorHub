using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Services.AdminForceUnpublishService;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Admin.Services.AdminForceUnpublishService;

public class AdminForceUnpublishServiceCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly AdminForceUnpublishServiceCommandHandler _handler;

    public AdminForceUnpublishServiceCommandHandlerTests()
    {
        _handler = new AdminForceUnpublishServiceCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_PublishedService_ShouldForceUnpublish()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var category = new Category { Id = Guid.NewGuid(), Name = "Mathematics" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Algebra", CategoryId = category.Id, Category = category };

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = Guid.NewGuid(),
            SubjectId = subject.Id,
            Subject = subject,
            Title = "Violating Service",
            Description = "Desc",
            TotalSessions = 10,
            SessionDurationMinutes = 60,
            Price = 3000000m,
            Status = ServiceStatus.Published
        };

        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new AdminForceUnpublishServiceCommand(service.Id, adminId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(ServiceStatus.Unpublished.ToString());
        service.Status.Should().Be(ServiceStatus.Unpublished);

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ServiceNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        _contextMock.Setup(c => c.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service>()).Object);

        var command = new AdminForceUnpublishServiceCommand(Guid.NewGuid(), Guid.NewGuid());

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }
}
