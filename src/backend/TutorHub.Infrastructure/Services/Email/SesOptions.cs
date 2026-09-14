using System.ComponentModel.DataAnnotations;

namespace TutorHub.Infrastructure.Services.Email;

/// <summary>
/// P0-E1: Amazon SES delivery settings. Only bound when the deployment actually
/// enables SES (a non-empty <c>Ses:FromAddress</c>), so Development can run
/// without an email provider while every other environment must configure one.
/// Credentials are deliberately NOT part of these options: the SES client uses
/// the standard AWS credential chain (environment, profile, instance role).
/// </summary>
public class SesOptions
{
    public const string SectionName = "Ses";

    [Required(ErrorMessage = "Ses:Region is required when SES is enabled.")]
    public string Region { get; set; } = default!;

    [Required(ErrorMessage = "Ses:FromAddress is required when SES is enabled.")]
    [EmailAddress(ErrorMessage = "Ses:FromAddress must be a valid email address.")]
    public string FromAddress { get; set; } = default!;

    /// <summary>Optional friendly name shown in the recipient's mail client.</summary>
    public string? FromDisplayName { get; set; }

    /// <summary>Optional SES configuration set used for event publishing.</summary>
    public string? ConfigurationSetName { get; set; }
}
