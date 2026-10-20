using System.ComponentModel.DataAnnotations;

namespace TutorHub.Infrastructure.Services.Email;

/// <summary>
/// SMTP delivery settings for MailKit. Only bound when the deployment configures
/// Smtp:Host and Smtp:FromAddress.
/// </summary>
public class SmtpOptions
{
    public const string SectionName = "Smtp";

    [Required(ErrorMessage = "Smtp:Host is required when SMTP is enabled.")]
    public string Host { get; set; } = default!;

    [Range(1, 65535, ErrorMessage = "Smtp:Port must be between 1 and 65535.")]
    public int Port { get; set; } = 587;

    public bool UseSsl { get; set; } = false;

    public string? UserName { get; set; }

    public string? Password { get; set; }

    [Required(ErrorMessage = "Smtp:FromAddress is required when SMTP is enabled.")]
    [EmailAddress(ErrorMessage = "Smtp:FromAddress must be a valid email address.")]
    public string FromAddress { get; set; } = default!;

    /// <summary>Optional friendly name shown in the recipient's mail client.</summary>
    public string? FromDisplayName { get; set; } = "TutorHub";
}
