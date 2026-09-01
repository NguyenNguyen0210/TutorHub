using System.Net;
using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Auth.Login;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;
using RefreshTokenEntity = TutorHub.Domain.Entities.RefreshToken;

namespace TutorHub.Application.UnitTests.Features.Auth.Login;

public class LoginCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly Mock<IPasswordHasher> _passwordHasherMock = new();
    private readonly Mock<IJwtService> _jwtServiceMock = new();
    private readonly LoginCommandHandler _handler;

    public LoginCommandHandlerTests()
    {
        _handler = new LoginCommandHandler(
            _contextMock.Object,
            _passwordHasherMock.Object,
            _jwtServiceMock.Object);
    }

    [Fact]
    public async Task Handle_WhenCredentialsAreValid_ShouldReturnTokenResponseAndAddRefreshToken()
    {
        // Arrange
        const string rawPassword = "SecurePassword123!";
        var user = new UserBuilder()
            .WithEmail("student@example.com")
            .WithFullName("Nguyen Van A")
            .WithRole(UserRole.Student)
            .Build();

        var usersList = new List<User> { user };
        var refreshTokensList = new List<RefreshTokenEntity>();

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);
        _contextMock.Setup(c => c.RefreshTokens).Returns(MockDbSetHelper.CreateMockDbSet(refreshTokensList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _passwordHasherMock
            .Setup(h => h.VerifyPassword(rawPassword, user.PasswordHash))
            .Returns(true);

        _jwtServiceMock
            .Setup(j => j.GenerateAccessToken(user, It.IsAny<Guid?>(), It.IsAny<Guid?>()))
            .Returns("mocked-jwt-access-token");

        _jwtServiceMock
            .Setup(j => j.GenerateRefreshToken())
            .Returns("mocked-refresh-token-string");

        var command = new LoginCommand("student@example.com", rawPassword);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().Be("mocked-jwt-access-token");
        result.RefreshToken.Should().Be("mocked-refresh-token-string");
        result.TokenType.Should().Be("Bearer");
        result.User.Id.Should().Be(user.Id);
        result.User.Email.Should().Be(user.Email);
        result.User.FullName.Should().Be(user.FullName);

        refreshTokensList.Should().ContainSingle(t => t.UserId == user.Id && t.Token == "mocked-refresh-token-string");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenUserDoesNotExist_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var usersList = new List<User>();
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        var command = new LoginCommand("nonexistent@example.com", "Password123!");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<UnauthorizedException>();
        ex.Which.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        ex.Which.Errors.Should().Contain("Invalid email or password.");

        _passwordHasherMock.Verify(h => h.VerifyPassword(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenPasswordIsIncorrect_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var user = new UserBuilder().WithEmail("user@example.com").Build();
        var usersList = new List<User> { user };

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        _passwordHasherMock
            .Setup(h => h.VerifyPassword("WrongPassword", user.PasswordHash))
            .Returns(false);

        var command = new LoginCommand("user@example.com", "WrongPassword");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<UnauthorizedException>();
        ex.Which.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        ex.Which.Errors.Should().Contain("Invalid email or password.");

        _jwtServiceMock.Verify(j => j.GenerateAccessToken(It.IsAny<User>(), It.IsAny<Guid?>(), It.IsAny<Guid?>()), Times.Never);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenUserIsSuspended_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var suspendedUser = new UserBuilder()
            .WithEmail("suspended@example.com")
            .WithStatus(AccountStatus.Suspended)
            .Build();

        var usersList = new List<User> { suspendedUser };

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        _passwordHasherMock
            .Setup(h => h.VerifyPassword("Password123!", suspendedUser.PasswordHash))
            .Returns(true);

        var command = new LoginCommand("suspended@example.com", "Password123!");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<UnauthorizedException>();
        ex.Which.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        ex.Which.Errors.Should().Contain("Your account has been suspended. Please contact support.");

        _jwtServiceMock.Verify(j => j.GenerateAccessToken(It.IsAny<User>(), It.IsAny<Guid?>(), It.IsAny<Guid?>()), Times.Never);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenUserIsBanned_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var bannedUser = new UserBuilder()
            .WithEmail("banned@example.com")
            .WithStatus(AccountStatus.Banned)
            .Build();

        var usersList = new List<User> { bannedUser };

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);

        _passwordHasherMock
            .Setup(h => h.VerifyPassword("Password123!", bannedUser.PasswordHash))
            .Returns(true);

        var command = new LoginCommand("banned@example.com", "Password123!");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<UnauthorizedException>();
        ex.Which.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        ex.Which.Errors.Should().Contain("Your account has been banned.");

        _jwtServiceMock.Verify(j => j.GenerateAccessToken(It.IsAny<User>(), It.IsAny<Guid?>(), It.IsAny<Guid?>()), Times.Never);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}