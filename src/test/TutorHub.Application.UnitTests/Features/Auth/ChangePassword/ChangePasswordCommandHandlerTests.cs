using System.Net;
using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Auth.ChangePassword;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Auth.ChangePassword;

public class ChangePasswordCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly Mock<IPasswordHasher> _passwordHasherMock = new();
    private readonly StubCurrentUserService _currentUser = new();
    private readonly ChangePasswordCommandHandler _handler;

    public ChangePasswordCommandHandlerTests()
    {
        _handler = new ChangePasswordCommandHandler(
            _contextMock.Object,
            StubClock.Instance,
            _passwordHasherMock.Object,
            _currentUser);
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
            TokenHash = "hash:active-session-token",
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

        _currentUser.Set(user.Id, UserRole.Student);

        var command = new ChangePasswordCommand(oldPassword, newPassword);

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

        var command = new ChangePasswordCommand("OldPassword123!", "NewPassword456!");

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

        _currentUser.Set(user.Id, UserRole.Student);

        var command = new ChangePasswordCommand("WrongOldPassword", "NewPassword456!");

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

    [Fact]
    public async Task Handle_ShouldCreateSecurityNotificationAndEmailDelivery_WhenPasswordChanged()
    {
        // Arrange
        var user = new UserBuilder().WithEmail("security@example.com").Build();
        var usersList = new List<User> { user };
        var tokensList = new List<Domain.Entities.RefreshToken>();
        var notificationsList = new List<Notification>();
        var emailDeliveriesList = new List<EmailDelivery>();

        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(usersList).Object);
        _contextMock.Setup(c => c.RefreshTokens).Returns(MockDbSetHelper.CreateMockDbSet(tokensList).Object);
        _contextMock.Setup(c => c.Notifications).Returns(MockDbSetHelper.CreateMockDbSet(notificationsList).Object);
        _contextMock.Setup(c => c.EmailDeliveries).Returns(MockDbSetHelper.CreateMockDbSet(emailDeliveriesList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _passwordHasherMock
            .Setup(h => h.VerifyPassword("OldPassword123!", user.PasswordHash))
            .Returns(true);

        _passwordHasherMock
            .Setup(h => h.HashPassword("NewPassword456!"))
            .Returns("$2a$11$newhash");

        _currentUser.Set(user.Id, UserRole.Student);

        var command = new ChangePasswordCommand("OldPassword123!", "NewPassword456!");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        notificationsList.Should().ContainSingle(n => n.Type == "PasswordChanged" && n.UserId == user.Id && n.IsCritical);
        emailDeliveriesList.Should().ContainSingle(e => e.ToEmail == "security@example.com" && e.UserId == user.Id);

        var email = emailDeliveriesList.Single();
        email.Subject.Should().Contain("Mật khẩu tài khoản TutorHub vừa được thay đổi");
        email.Status.Should().Be(EmailDeliveryStatus.Pending);
    }
}
