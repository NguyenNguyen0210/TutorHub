using System.ComponentModel.DataAnnotations;

namespace TutorHub.Infrastructure.Services.Email;

/// <summary>
/// SMTP delivery settings for MailKit. Only bound when the deployment configures
/// Smtp:Host and Smtp:FromAddress.
/// </summary>
public class SmtpOptions : IValidatableObject
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

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!string.Equals(Host, "smtp.resend.com", StringComparison.OrdinalIgnoreCase))
            yield break;

        if (UserName != "resend")
            yield return new ValidationResult("Resend SMTP requires Smtp:UserName to be 'resend'.", new[] { nameof(UserName) });

        if (string.IsNullOrWhiteSpace(Password))
            yield return new ValidationResult("Set a Resend API key in Smtp:Password before enabling Resend SMTP.", new[] { nameof(Password) });

        if (Port is not (25 or 465 or 587 or 2465 or 2587))
            yield return new ValidationResult("Resend SMTP supports ports 25, 465, 587, 2465 and 2587.", new[] { nameof(Port) });
        else if (UseSsl != (Port is 465 or 2465))
            yield return new ValidationResult("Use Smtp:UseSsl=true for ports 465/2465; use false for STARTTLS on ports 25/587/2587.", new[] { nameof(UseSsl) });
    }
}
