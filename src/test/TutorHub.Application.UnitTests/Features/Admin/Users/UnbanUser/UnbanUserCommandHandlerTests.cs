using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Users.UnbanUser;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Admin.Users.UnbanUser;

public class UnbanUserCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly Mock<IAuditLogService> _auditLogServiceMock = new();
    private readonly StubCurrentUserService _currentUser = new();
    private readonly UnbanUserCommandHandler _handler;

    public UnbanUserCommandHandlerTests()
    {
        _handler = new UnbanUserCommandHandler(_contextMock.Object, StubClock.Instance, _auditLogServiceMock.Object, _currentUser);
    }

    [Fact]
    public async Task Handle_WhenUserIsBanned_ShouldUnbanUser_AndCreateAuditLog()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        _currentUser.Set(adminId, UserRole.Admin);
        var targetUser = new UserBuilder()
            .WithRole(UserRole.Student)
            .WithStatus(AccountStatus.Banned)
            .Build();

        var usersList = new List<User> { targetUser };
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new UnbanUserCommand(targetUser.Id, "Appeal approved after review");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(targetUser.Id);
        result.Status.Should().Be(AccountStatus.Active);
        targetUser.Status.Should().Be(AccountStatus.Active);

        _auditLogServiceMock.Verify(a => a.LogAsync(
            "USER_UNBANNED",
            "User",
            targetUser.Id.ToString(),
            adminId,
            It.IsAny<object>(),
            It.IsAny<object>(),
            null,
            null,
            null,
            It.IsAny<CancellationToken>()), Times.Once);

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData(AccountStatus.Active)]
    [InlineData(AccountStatus.Suspended)]
    public async Task Handle_WhenUserIsNotBanned_ShouldThrowConflictException(AccountStatus status)
    {
        // Arrange
        var adminId = Guid.NewGuid();
        _currentUser.Set(adminId, UserRole.Admin);
        var targetUser = new UserBuilder()
            .WithRole(UserRole.Student)
            .WithStatus(status)
            .Build();

        var usersList = new List<User> { targetUser };
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        var command = new UnbanUserCommand(targetUser.Id, "Pardon attempt");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("Only Banned accounts can be unbanned"));
    }

    [Fact]
    public async Task Handle_WhenUserNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        _currentUser.Set(adminId, UserRole.Admin);
        var usersList = new List<User>();
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        var command = new UnbanUserCommand(Guid.NewGuid(), "Non-existent user");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }
}
