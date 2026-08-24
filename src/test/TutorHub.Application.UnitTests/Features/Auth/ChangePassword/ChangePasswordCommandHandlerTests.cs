using System.Net;
using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Auth.ChangePassword;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Auth.ChangePassword;

public class ChangePasswordCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly Mock<IPasswordHasher> _passwordHasherMock = new();
    private readonly ChangePasswordCommandHandler _handler;

    public ChangePasswordCommandHandlerTests()
    {
        _handler = new ChangePasswordCommandHandler(
            _contextMock.Object,
            _passwordHasherMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldUpdatePasswordHashAndRevokeAllActiveSessions_WhenOldPasswordIsCorrect()
    {
        // Arrange
        const string oldPassword = "OldPassword123!";
        const string newPassword = "NewPassword456!";
        const string newHashedPassword = "$2a$11$new_hashed_password_value";

        var user = new UserBuilder().Build();
        var activeToken = new Domain.Entities.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = "active-session-token",
            ExpiresAt = DateTime.UtcNow.AddDays(5),
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            RevokedAt = null
        };

        var usersList = new List<User> { user };
        var tokensList = new List<Domain.Entities.RefreshToken> { activeToken };

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);
        _contextMock.Setup(c => c.RefreshTokens).Returns(MockDbSetHelper.CreateMockDbSet(tokensList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _passwordHasherMock
            .Setup(h => h.VerifyPassword(oldPassword, user.PasswordHash))
            .Returns(true);

        _passwordHasherMock
            .Setup(h => h.HashPassword(newPassword))
            .Returns(newHashedPassword);

        var command = new ChangePasswordCommand(user.Id, oldPassword, newPassword);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        user.PasswordHash.Should().Be(newHashedPassword);

        // Verify side effect: active refresh tokens must be revoked
        activeToken.RevokedAt.Should().NotBeNull();

        _passwordHasherMock.Verify(h => h.HashPassword(newPassword), Times.Once);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldThrowNotFoundException_WhenUserDoesNotExist()
    {
        // Arrange
        var usersList = new List<User>();
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        var command = new ChangePasswordCommand(Guid.NewGuid(), "OldPassword123!", "NewPassword456!");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<NotFoundException>();
        ex.Which.StatusCode.Should().Be(HttpStatusCode.NotFound);

        _passwordHasherMock.Verify(h => h.VerifyPassword(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldThrowUnauthorizedException_WhenCurrentPasswordIsIncorrect()
    {
        // Arrange
        var user = new UserBuilder().Build();
        var initialHash = user.PasswordHash;

        var usersList = new List<User> { user };
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        _passwordHasherMock
            .Setup(h => h.VerifyPassword("WrongOldPassword", user.PasswordHash))
            .Returns(false);

        var command = new ChangePasswordCommand(user.Id, "WrongOldPassword", "NewPassword456!");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<UnauthorizedException>();
        ex.Which.Errors.Should().Contain("Current password is incorrect.");

        // Verify password hash was NOT modified
        user.PasswordHash.Should().Be(initialHash);
        _passwordHasherMock.Verify(h => h.HashPassword(It.IsAny<string>()), Times.Never);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
