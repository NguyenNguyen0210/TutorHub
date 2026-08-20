using System.Text.RegularExpressions;
using FluentValidation;

namespace TutorHub.Application.Features.Users.UpdateMyProfile;

public class UpdateMyProfileCommandValidator : AbstractValidator<UpdateMyProfileCommand>
{
    // Vietnamese mobile phone numbers format: starts with 03, 05, 07, 08, 09 followed by 8 digits (total 10 digits)
    private static readonly Regex VietnamPhoneRegex = new(@"^(0)(3|5|7|8|9)[0-9]{8}$", RegexOptions.Compiled);

    public UpdateMyProfileCommandValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("FullName is required.")
            .Must(n => !string.IsNullOrWhiteSpace(n) && n.Trim().Length >= 2)
            .WithMessage("FullName must be at least 2 non-whitespace characters.")
            .MaximumLength(100).WithMessage("FullName cannot exceed 100 characters.");

        RuleFor(x => x.Phone)
            .Must(phone =>
            {
                if (string.IsNullOrWhiteSpace(phone))
                {
                    return true;
                }

                var clean = phone.Trim().Replace(" ", "").Replace("-", "").Replace(".", "");
                if (clean.StartsWith("+84"))
                {
                    clean = "0" + clean.Substring(3);
                }
                else if (clean.StartsWith("84") && clean.Length == 11)
                {
                    clean = "0" + clean.Substring(2);
                }

                return VietnamPhoneRegex.IsMatch(clean);
            })
            .WithMessage("Phone number must be a valid Vietnamese mobile number (e.g. 0912345678, +84912345678, or 84912345678).");

        RuleFor(x => x.AvatarUrl)
            .MaximumLength(500).WithMessage("Avatar URL cannot exceed 500 characters.")
            .Must(url => string.IsNullOrWhiteSpace(url) || (Uri.TryCreate(url.Trim(), UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)))
            .WithMessage("Avatar URL must be a valid HTTP or HTTPS URL.");
    }
}
