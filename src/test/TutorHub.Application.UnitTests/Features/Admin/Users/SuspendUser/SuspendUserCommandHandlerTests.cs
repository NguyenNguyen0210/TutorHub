using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Users.SuspendUser;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Admin.Users.SuspendUser;

public class SuspendUserCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly SuspendUserCommandHandler _handler;

    public SuspendUserCommandHandlerTests()
    {
        _handler = new SuspendUserCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldSuspendActiveUser_AndRevokeTokens_AndCreateAuditLog()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var targetUser = new UserBuilder()
            .WithRole(UserRole.Student)
            .WithStatus(AccountStatus.Active)
            .Build();

        var usersList = new List<User> { targetUser };
        var auditLogsList = new List<AccountStatusAuditLog>();
        var activeToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = targetUser.Id,
            Token = "active-refresh-token",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            RevokedAt = null
        };
        var tokensList = new List<RefreshToken> { activeToken };

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);
        _contextMock.Setup(c => c.AccountStatusAuditLogs).Returns(MockDbSetHelper.CreateMockDbSet(auditLogsList).Object);
        _contextMock.Setup(c => c.RefreshTokens).Returns(MockDbSetHelper.CreateMockDbSet(tokensList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new SuspendUserCommand(targetUser.Id, adminId, "Repeated policy violations");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(AccountStatus.Suspended);
        targetUser.Status.Should().Be(AccountStatus.Suspended);

        // Token revocation
        activeToken.RevokedAt.Should().NotBeNull();

        // Audit Trail check
        auditLogsList.Should().ContainSingle();
        var log = auditLogsList.Single();
        log.TargetUserId.Should().Be(targetUser.Id);
        log.AdminUserId.Should().Be(adminId);
        log.PreviousStatus.Should().Be(AccountStatus.Active);
        log.NewStatus.Should().Be(AccountStatus.Suspended);
        log.Reason.Should().Be("Repeated policy violations");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldThrowConflict_WhenAdminSuspendsSelf()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var command = new SuspendUserCommand(adminId, adminId, "Self suspension attempt");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain("Admin cannot suspend their own account.");

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

        var command = new SuspendUserCommand(nonExistentUserId, adminId, "Non existent user");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldThrowConflict_WhenSuspendingLastActiveAdmin()
    {
        // Arrange
        var currentAdminId = Guid.NewGuid();
        var targetAdmin = new UserBuilder()
            .WithRole(UserRole.Admin)
            .WithStatus(AccountStatus.Active)
            .Build();

        var usersList = new List<User> { targetAdmin };

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        var command = new SuspendUserCommand(targetAdmin.Id, currentAdminId, "Suspend the only admin");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain("Cannot suspend the last active administrator on the platform.");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldThrowConflict_WhenUserAlreadySuspended()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var suspendedUser = new UserBuilder()
            .WithRole(UserRole.Student)
            .WithStatus(AccountStatus.Suspended)
            .Build();

        var usersList = new List<User> { suspendedUser };

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        var command = new SuspendUserCommand(suspendedUser.Id, adminId, "Already suspended");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().ContainMatch("*Cannot suspend account with status 'Suspended'*");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
