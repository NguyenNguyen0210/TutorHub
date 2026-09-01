using System.Net;
using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Auth.RefreshToken;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Auth.RefreshToken;

public class RefreshTokenCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly Mock<IJwtService> _jwtServiceMock = new();
    private readonly RefreshTokenCommandHandler _handler;

    public RefreshTokenCommandHandlerTests()
    {
        _handler = new RefreshTokenCommandHandler(
            _contextMock.Object,
            _jwtServiceMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldRotateToken_WhenTokenIsValid()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Student).Build();
        var existingToken = new Domain.Entities.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Token = "valid-old-refresh-token",
            ExpiresAt = DateTime.UtcNow.AddDays(3),
            CreatedAt = DateTime.UtcNow.AddDays(-4),
            RevokedAt = null
        };

        var tokensList = new List<Domain.Entities.RefreshToken> { existingToken };
        _contextMock.Setup(c => c.RefreshTokens).Returns(MockDbSetHelper.CreateMockDbSet(tokensList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _jwtServiceMock
            .Setup(j => j.GenerateAccessToken(user, It.IsAny<Guid?>(), It.IsAny<Guid?>()))
            .Returns("new-access-token");

        _jwtServiceMock
            .Setup(j => j.GenerateRefreshToken())
            .Returns("new-refresh-token");

        var command = new RefreshTokenCommand("valid-old-refresh-token");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().Be("new-access-token");
        result.RefreshToken.Should().Be("new-refresh-token");

        // Verify side effects: old token revoked, new token added
        existingToken.RevokedAt.Should().NotBeNull();
        tokensList.Should().ContainSingle(t => t.Token == "new-refresh-token" && t.UserId == user.Id && t.RevokedAt == null);

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldThrowUnauthorized_WhenTokenDoesNotExist()
    {
        // Arrange
        var tokensList = new List<Domain.Entities.RefreshToken>();
        _contextMock.Setup(c => c.RefreshTokens).Returns(MockDbSetHelper.CreateMockDbSet(tokensList).Object);

        var command = new RefreshTokenCommand("nonexistent-token");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<UnauthorizedException>();
        ex.Which.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        ex.Which.Errors.Should().Contain("Invalid refresh token.");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldThrowUnauthorized_WhenTokenIsExpired()
    {
        // Arrange
        var user = new UserBuilder().Build();
        var expiredToken = new Domain.Entities.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Token = "expired-token",
            ExpiresAt = DateTime.UtcNow.AddMinutes(-10), // Expired
            CreatedAt = DateTime.UtcNow.AddDays(-7),
            RevokedAt = null
        };

        var tokensList = new List<Domain.Entities.RefreshToken> { expiredToken };
        _contextMock.Setup(c => c.RefreshTokens).Returns(MockDbSetHelper.CreateMockDbSet(tokensList).Object);

        var command = new RefreshTokenCommand("expired-token");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<UnauthorizedException>();
        ex.Which.Errors.Should().Contain("Refresh token has expired. Please log in again.");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldDetectTokenReplayAndRevokeAllSessions_WhenTokenIsAlreadyRevoked()
    {
        // Arrange - Compromised scenario: old revoked token of User A is reused
        var userA = new UserBuilder().WithEmail("userA@example.com").Build();
        var userB = new UserBuilder().WithEmail("userB@example.com").Build();

        var compromisedTokenA = new Domain.Entities.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userA.Id,
            User = userA,
            Token = "already-revoked-token-A",
            ExpiresAt = DateTime.UtcNow.AddDays(3),
            CreatedAt = DateTime.UtcNow.AddDays(-4),
            RevokedAt = DateTime.UtcNow.AddMinutes(-30) // Already revoked
        };

        var activeSiblingTokenA = new Domain.Entities.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userA.Id,
            User = userA,
            Token = "active-sibling-token-A",
            ExpiresAt = DateTime.UtcNow.AddDays(3),
            CreatedAt = DateTime.UtcNow.AddMinutes(-30),
            RevokedAt = null // Currently active
        };

        var activeTokenUserB = new Domain.Entities.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userB.Id,
            User = userB,
            Token = "active-token-user-B",
            ExpiresAt = DateTime.UtcNow.AddDays(3),
            CreatedAt = DateTime.UtcNow.AddMinutes(-10),
            RevokedAt = null // Should remain untouched
        };

        var tokensList = new List<Domain.Entities.RefreshToken> { compromisedTokenA, activeSiblingTokenA, activeTokenUserB };
        _contextMock.Setup(c => c.RefreshTokens).Returns(MockDbSetHelper.CreateMockDbSet(tokensList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new RefreshTokenCommand("already-revoked-token-A");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<UnauthorizedException>();
        ex.Which.Errors.Should().Contain("Security Alert: Invalid refresh token reuse detected. All active sessions have been terminated.");

        // Verify side effects:
        // 1. Compromised user's active sibling token MUST now be revoked
        activeSiblingTokenA.RevokedAt.Should().NotBeNull();

        // 2. Unrelated user B's token MUST remain active (Isolation check)
        activeTokenUserB.RevokedAt.Should().BeNull();

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldThrowUnauthorized_WhenUserIsSuspended()
    {
        // Arrange
        var suspendedUser = new UserBuilder().WithStatus(AccountStatus.Suspended).Build();
        var token = new Domain.Entities.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = suspendedUser.Id,
            User = suspendedUser,
            Token = "valid-token-suspended-user",
            ExpiresAt = DateTime.UtcNow.AddDays(3),
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            RevokedAt = null
        };

        var tokensList = new List<Domain.Entities.RefreshToken> { token };
        _contextMock.Setup(c => c.RefreshTokens).Returns(MockDbSetHelper.CreateMockDbSet(tokensList).Object);

        var command = new RefreshTokenCommand("valid-token-suspended-user");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<UnauthorizedException>();
        ex.Which.Errors.Should().Contain("Your account has been suspended. Please contact support.");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldThrowUnauthorized_WhenUserIsBanned()
    {
        // Arrange
        var bannedUser = new UserBuilder().WithStatus(AccountStatus.Banned).Build();
        var token = new Domain.Entities.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = bannedUser.Id,
            User = bannedUser,
            Token = "valid-token-banned-user",
            ExpiresAt = DateTime.UtcNow.AddDays(3),
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            RevokedAt = null
        };

        var tokensList = new List<Domain.Entities.RefreshToken> { token };
        _contextMock.Setup(c => c.RefreshTokens).Returns(MockDbSetHelper.CreateMockDbSet(tokensList).Object);

        var command = new RefreshTokenCommand("valid-token-banned-user");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<UnauthorizedException>();
        ex.Which.Errors.Should().Contain("Your account has been banned.");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
