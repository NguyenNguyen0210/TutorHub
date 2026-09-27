using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Auth.ExternalLogin;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;
using ExternalLoginEntity = TutorHub.Domain.Entities.ExternalLogin;
using RefreshTokenEntity = TutorHub.Domain.Entities.RefreshToken;

namespace TutorHub.Application.UnitTests.Features.Auth.ExternalLogin;

public class CompleteExternalLoginCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly Mock<IPasswordHasher> _passwordHasherMock = new();
    private readonly Mock<IJwtService> _jwtServiceMock = new();
    private readonly Mock<IExternalAuthProvider> _providerMock = new();
    private readonly Mock<IExternalAuthStateStore> _stateStoreMock = new();
    private readonly DateTime _now = new(2026, 9, 27, 2, 0, 0, DateTimeKind.Utc);
    private readonly CompleteExternalLoginCommandHandler _handler;

    public CompleteExternalLoginCommandHandlerTests()
    {
        _providerMock.SetupGet(p => p.Provider).Returns(ExternalAuthProvider.Google);
        _providerMock.SetupGet(p => p.IsConfigured).Returns(true);
        _stateStoreMock
            .Setup(s => s.Consume(It.IsAny<string>(), It.IsAny<ExternalAuthProvider>(), It.IsAny<CancellationToken>()))
            .Returns(new PendingExternalAuth(ExternalAuthProvider.Google, "verifier", null));
        _passwordHasherMock
            .Setup(h => h.HashPassword(It.IsAny<string>()))
            .Returns("hashed-random-secret");
        _jwtServiceMock
            .Setup(j => j.GenerateAccessToken(It.IsAny<User>(), It.IsAny<Guid?>(), It.IsAny<Guid?>()))
            .Returns("mocked-jwt-access-token");
        _jwtServiceMock
            .Setup(j => j.GenerateRefreshToken())
            .Returns("mocked-refresh-token-string");

        var options = Options.Create(new ExternalAuthOptions
        {
            Google = new ExternalAuthProviderOptions { ClientId = "cid", ClientSecret = "csecret" },
            RedirectUri = "http://localhost:5173/auth/oauth/callback"
        });

        _handler = new CompleteExternalLoginCommandHandler(
            _contextMock.Object,
            new StubClock(_now),
            _passwordHasherMock.Object,
            _jwtServiceMock.Object,
            new StubRefreshTokenHasher(),
            new[] { _providerMock.Object },
            _stateStoreMock.Object,
            options,
            Options.Create(new AuthTokenLifetimeOptions()));
    }

    private void SetupExchange(ExternalIdentity identity)
    {
        _providerMock
            .Setup(p => p.ExchangeCodeAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(identity);
    }

    [Fact]
    public async Task Handle_FirstTimeGoogleLogin_ShouldCreateStudentAndLinkWithoutThrowing()
    {
        // Arrange: no ExternalLogin and no User exist — the exact case that used
        // to crash with NullReferenceException on `externalLogin!.LastLoginAt`.
        var externalLogins = new List<ExternalLoginEntity>();
        var users = new List<User>();
        var studentProfiles = new List<StudentProfile>();
        var refreshTokens = new List<RefreshTokenEntity>();

        _contextMock.Setup(c => c.ExternalLogins).Returns(MockDbSetHelper.CreateMockDbSet(externalLogins).Object);
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(users).Object);
        _contextMock.Setup(c => c.StudentProfiles).Returns(MockDbSetHelper.CreateMockDbSet(studentProfiles).Object);
        _contextMock.Setup(c => c.RefreshTokens).Returns(MockDbSetHelper.CreateMockDbSet(refreshTokens).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        SetupExchange(new ExternalIdentity(
            ExternalAuthProvider.Google, "google-sub-1", "New@Example.com", true, "Nguyen Van A", "http://pic"));

        // Act
        var result = await _handler.Handle(
            new CompleteExternalLoginCommand("google", "code", "state", null), CancellationToken.None);

        // Assert
        result.AccessToken.Should().Be("mocked-jwt-access-token");
        result.User.Role.Should().Be(UserRole.Student.ToString());
        result.User.Email.Should().Be("new@example.com");
        result.User.FullName.Should().Be("Nguyen Van A");
        result.User.AvatarUrl.Should().Be("http://pic");

        users.Should().ContainSingle();
        studentProfiles.Should().ContainSingle();
        externalLogins.Should().ContainSingle(l =>
            l.Provider == ExternalAuthProvider.Google
            && l.ProviderUserId == "google-sub-1"
            && l.UserId == users[0].Id
            && l.LastLoginAt == _now);

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ExistingEmailWithVerifiedAddress_ShouldLinkAndKeepRole()
    {
        // Arrange
        var tutor = new UserBuilder()
            .WithEmail("tutor@example.com")
            .WithFullName("Tutor Hien Co")
            .WithRole(UserRole.Tutor)
            .Build();

        var externalLogins = new List<ExternalLoginEntity>();
        var users = new List<User> { tutor };
        var refreshTokens = new List<RefreshTokenEntity>();

        _contextMock.Setup(c => c.ExternalLogins).Returns(MockDbSetHelper.CreateMockDbSet(externalLogins).Object);
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(users).Object);
        _contextMock.Setup(c => c.RefreshTokens).Returns(MockDbSetHelper.CreateMockDbSet(refreshTokens).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        SetupExchange(new ExternalIdentity(
            ExternalAuthProvider.Google, "google-sub-9", "tutor@example.com", true, "Other Name", null));

        // Act
        var result = await _handler.Handle(
            new CompleteExternalLoginCommand("Google", "code", "state", null), CancellationToken.None);

        // Assert: linked to the existing account, role untouched, no duplicate user.
        result.User.Id.Should().Be(tutor.Id);
        result.User.Role.Should().Be(UserRole.Tutor.ToString());
        users.Should().ContainSingle();
        externalLogins.Should().ContainSingle(l =>
            l.UserId == tutor.Id && l.ProviderUserId == "google-sub-9");
    }

    [Fact]
    public async Task Handle_ExistingTutorLinksGoogle_JwtIncludesTutorProfileId()
    {
        // Arrange: an existing Tutor with a TutorProfile, no prior ExternalLogin.
        var tutorProfileId = Guid.NewGuid();
        var tutor = new UserBuilder()
            .WithEmail("linked-tutor@example.com")
            .WithFullName("Tutor With Profile")
            .WithRole(UserRole.Tutor)
            .WithTutorProfile(new TutorProfile
            {
                Id = tutorProfileId,
                Bio = "Test bio",
                Education = "Test education",
                ExperienceYears = 3,
                TeachingMode = TeachingMode.Online
            })
            .Build();

        var externalLogins = new List<ExternalLoginEntity>();
        var users = new List<User> { tutor };
        var refreshTokens = new List<RefreshTokenEntity>();

        _contextMock.Setup(c => c.ExternalLogins).Returns(MockDbSetHelper.CreateMockDbSet(externalLogins).Object);
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(users).Object);
        _contextMock.Setup(c => c.RefreshTokens).Returns(MockDbSetHelper.CreateMockDbSet(refreshTokens).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        SetupExchange(new ExternalIdentity(
            ExternalAuthProvider.Google, "google-sub-tutor", "linked-tutor@example.com", true, "Tutor With Profile", null));

        // Act
        var result = await _handler.Handle(
            new CompleteExternalLoginCommand("Google", "code", "state", null), CancellationToken.None);

        // Assert: the returned UserDto must carry the TutorProfile.Id.
        result.User.IdProfile.Should().NotBeNull();
        result.User.IdProfile.Should().Be(tutorProfileId);
    }
}
