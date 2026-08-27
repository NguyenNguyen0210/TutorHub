using System.Net;
using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Auth.Logout;
using TutorHub.Application.UnitTests.TestHelpers;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Auth.Logout;

public class LogoutCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly LogoutCommandHandler _handler;

    public LogoutCommandHandlerTests()
    {
        _handler = new LogoutCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldRevokeTokenAndSave_WhenActiveTokenExists()
    {
        // Arrange
        var token = new Domain.Entities.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Token = "active-logout-token",
            ExpiresAt = DateTime.UtcNow.AddDays(5),
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            RevokedAt = null
        };

        var tokensList = new List<Domain.Entities.RefreshToken> { token };
        _contextMock.Setup(c => c.RefreshTokens).Returns(MockDbSetHelper.CreateMockDbSet(tokensList).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new LogoutCommand("active-logout-token");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        token.RevokedAt.Should().NotBeNull();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnTrueWithoutSaving_WhenTokenIsAlreadyRevoked()
    {
        // Arrange
        var revokedToken = new Domain.Entities.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Token = "already-revoked-token",
            ExpiresAt = DateTime.UtcNow.AddDays(5),
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            RevokedAt = DateTime.UtcNow.AddDays(-1)
        };

        var tokensList = new List<Domain.Entities.RefreshToken> { revokedToken };
        _contextMock.Setup(c => c.RefreshTokens).Returns(MockDbSetHelper.CreateMockDbSet(tokensList).Object);

        var command = new LogoutCommand("already-revoked-token");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldThrowNotFoundException_WhenTokenDoesNotExist()
    {
        // Arrange
        var tokensList = new List<Domain.Entities.RefreshToken>();
        _contextMock.Setup(c => c.RefreshTokens).Returns(MockDbSetHelper.CreateMockDbSet(tokensList).Object);

        var command = new LogoutCommand("nonexistent-token");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<NotFoundException>();
        ex.Which.StatusCode.Should().Be(HttpStatusCode.NotFound);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
