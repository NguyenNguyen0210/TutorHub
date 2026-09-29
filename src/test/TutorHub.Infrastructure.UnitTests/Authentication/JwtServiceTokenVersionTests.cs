using FluentAssertions;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.Authentication;

namespace TutorHub.Infrastructure.UnitTests.Authentication;

/// <summary>
/// WP6: every access token carries the per-user <c>ver</c> claim so the
/// revocation middleware can compare it against the cached version.
/// </summary>
public class JwtServiceTokenVersionTests
{
    private static JwtService CreateService()
    {
        var options = Options.Create(new JwtOptions
        {
            Secret = "0123456789abcdef0123456789abcdef",
            Issuer = "test-issuer",
            Audience = "test-audience",
            AccessTokenExpirationMinutes = 15
        });
        return new JwtService(options, new FixedClock());
    }

    private static User NewUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "student@example.com",
        PasswordHash = "$2a$11$mocked_password_hash_value_12345",
        FullName = "Test User",
        Role = UserRole.Student
    };

    [Fact]
    public void GenerateAccessToken_NewUser_EmitsVerClaimZero()
    {
        var service = CreateService();

        var token = service.GenerateAccessToken(NewUser());

        ReadVerClaim(token).Should().Be("0");
    }

    [Fact]
    public void GenerateAccessToken_AfterBump_EmitsVerClaimOne()
    {
        var service = CreateService();
        var user = NewUser();
        user.BumpTokenVersion();

        var token = service.GenerateAccessToken(user);

        ReadVerClaim(token).Should().Be("1");
    }

    private static string? ReadVerClaim(string token)
    {
        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);
        return jwt.Claims.FirstOrDefault(c => c.Type == "ver")?.Value;
    }

    private sealed class FixedClock : IClock
    {
        public DateTime UtcNow => new(2026, 9, 29, 12, 0, 0, DateTimeKind.Utc);
    }
}
