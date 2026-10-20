using System.Text.RegularExpressions;
using FluentValidation;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Auth.Register;

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    // Vietnamese mobile phone numbers format: starts with 03, 05, 07, 08, 09 followed by 8 digits (total 10 digits)
    private static readonly Regex VietnamPhoneRegex = new(@"^(0)(3|5|7|8|9)[0-9]{8}$", RegexOptions.Compiled);

    public RegisterCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email is required.")
            .MaximumLength(256);

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters long.")
            .MaximumLength(100);

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(100);

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
            .WithMessage("Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại di động Việt Nam (VD: 0912345678, +84912345678).");

        RuleFor(x => x.Role)
            .IsInEnum().WithMessage("Valid role is required.")
            .Must(r => r == UserRole.Student || r == UserRole.Tutor)
            .WithMessage("Only Student and Tutor roles can register directly.");
    }
}
