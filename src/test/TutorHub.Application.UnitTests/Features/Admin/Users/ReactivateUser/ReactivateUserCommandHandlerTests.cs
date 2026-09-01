using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Users.ReactivateUser;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Admin.Users.ReactivateUser;

public class ReactivateUserCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly ReactivateUserCommandHandler _handler;

    public ReactivateUserCommandHandlerTests()
    {
        _handler = new ReactivateUserCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReactivateSuspendedUser_AndCreateAuditLog()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var suspendedUser = new UserBuilder()
            .WithRole(UserRole.Student)
            .WithStatus(AccountStatus.Suspended)
            .Build();

        var usersList = new List<User> { suspendedUser };
        var auditLogsList = new List<AccountStatusAuditLog>();

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);
        _contextMock.Setup(c => c.AccountStatusAuditLogs).Returns(MockDbSetHelper.CreateMockDbSet(auditLogsList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new ReactivateUserCommand(suspendedUser.Id, adminId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(AccountStatus.Active);
        suspendedUser.Status.Should().Be(AccountStatus.Active);

        // Audit Trail check
        auditLogsList.Should().ContainSingle();
        var log = auditLogsList.Single();
        log.TargetUserId.Should().Be(suspendedUser.Id);
        log.AdminUserId.Should().Be(adminId);
        log.PreviousStatus.Should().Be(AccountStatus.Suspended);
        log.NewStatus.Should().Be(AccountStatus.Active);

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldThrowConflict_WhenUserIsActive()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var activeUser = new UserBuilder()
            .WithRole(UserRole.Student)
            .WithStatus(AccountStatus.Active)
            .Build();

        var usersList = new List<User> { activeUser };

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        var command = new ReactivateUserCommand(activeUser.Id, adminId);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().ContainMatch("*Cannot reactivate account with status 'Active'*");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldThrowConflict_WhenUserIsBanned()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var bannedUser = new UserBuilder()
            .WithRole(UserRole.Student)
            .WithStatus(AccountStatus.Banned)
            .Build();

        var usersList = new List<User> { bannedUser };

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        var command = new ReactivateUserCommand(bannedUser.Id, adminId);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().ContainMatch("*Cannot reactivate account with status 'Banned'*");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldThrowNotFound_WhenUserDoesNotExist()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var nonExistentUserId = Guid.NewGuid();
        var usersList = new List<User>();

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        var command = new ReactivateUserCommand(nonExistentUserId, adminId);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
