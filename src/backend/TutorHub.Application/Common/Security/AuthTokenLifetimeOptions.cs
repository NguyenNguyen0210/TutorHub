namespace TutorHub.Application.Common.Security;

/// <summary>
/// Token lifetime contract (F-06). Binds to the same "Jwt" configuration
/// section as the infrastructure JwtOptions so refresh-token persistence and
/// response DTO expiries always match the real signing lifetimes.
/// </summary>
public class AuthTokenLifetimeOptions
{
    public const string SectionName = "Jwt";

    public int AccessTokenExpirationMinutes { get; set; } = 15;

    public int RefreshTokenExpirationDays { get; set; } = 7;
}
