using System.ComponentModel.DataAnnotations;

namespace TutorHub.Application.Common.Security;

/// <summary>
/// P0-D3: account lockout thresholds. These are security defaults, not business
/// policy — they are bounded so a bad configuration cannot lock every account
/// forever or disable the protection entirely.
/// </summary>
public class AuthLockoutOptions
{
    public const string SectionName = "Auth";

    [Range(1, 100, ErrorMessage = "Max failed login attempts must be between 1 and 100.")]
    public int MaxFailedAttempts { get; set; } = 5;

    [Range(1, 1440, ErrorMessage = "Lockout duration must be between 1 and 1440 minutes.")]
    public int LockoutMinutes { get; set; } = 15;
}
