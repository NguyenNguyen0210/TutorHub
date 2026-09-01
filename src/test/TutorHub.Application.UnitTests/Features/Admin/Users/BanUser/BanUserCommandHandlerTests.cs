using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Users.BanUser;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Admin.Users.BanUser;

public class BanUserCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly BanUserCommandHandler _handler;

    public BanUserCommandHandlerTests()
    {
        _handler = new BanUserCommandHandler(_contextMock.Object);
    }

    [Theory]
    [InlineData(AccountStatus.Active)]
    [InlineData(AccountStatus.Suspended)]
    public async Task Handle_ShouldBanUser_AndRevokeTokens_AndCreateAuditLog(AccountStatus initialStatus)
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var targetUser = new UserBuilder()
            .WithRole(UserRole.Student)
            .WithStatus(initialStatus)
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

        var command = new BanUserCommand(targetUser.Id, adminId, "Severe fraud violations");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(AccountStatus.Banned);
        targetUser.Status.Should().Be(AccountStatus.Banned);

        // Token revocation
        activeToken.RevokedAt.Should().NotBeNull();

        // Audit Trail check
        auditLogsList.Should().ContainSingle();
        var log = auditLogsList.Single();
        log.TargetUserId.Should().Be(targetUser.Id);
        log.AdminUserId.Should().Be(adminId);
        log.PreviousStatus.Should().Be(initialStatus);
        log.NewStatus.Should().Be(AccountStatus.Banned);
        log.Reason.Should().Be("Severe fraud violations");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldThrowConflict_WhenAdminBansSelf()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var command = new BanUserCommand(adminId, adminId, "Self ban attempt");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain("Admin cannot ban their own account.");

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

        var command = new BanUserCommand(nonExistentUserId, adminId, "Non existent user");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldThrowConflict_WhenBanningLastActiveAdmin()
    {
        // Arrange
        var currentAdminId = Guid.NewGuid();
        var targetAdmin = new UserBuilder()
            .WithRole(UserRole.Admin)
            .WithStatus(AccountStatus.Active)
            .Build();

        var usersList = new List<User> { targetAdmin };

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        var command = new BanUserCommand(targetAdmin.Id, currentAdminId, "Ban the only admin");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().Contain("Cannot ban the last active administrator on the platform.");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldThrowConflict_WhenUserAlreadyBanned()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var bannedUser = new UserBuilder()
            .WithRole(UserRole.Student)
            .WithStatus(AccountStatus.Banned)
            .Build();

        var usersList = new List<User> { bannedUser };

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        var command = new BanUserCommand(bannedUser.Id, adminId, "Already banned");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.Which.Errors.Should().ContainMatch("*already banned*");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
