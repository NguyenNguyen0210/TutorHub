using FluentValidation;
using System.Text.RegularExpressions;

namespace TutorHub.Application.Features.Auth.ForgotPassword;

public class ForgotPasswordCommandValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordCommandValidator()
    {
        RuleFor(x => x.Email)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Email không được để trống.")
            .MaximumLength(256).WithMessage("Email không được vượt quá 256 ký tự.")
            .Must(email => Regex.IsMatch(email.Trim(), @"^[^\s@]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$", RegexOptions.IgnoreCase))
            .WithMessage("Vui lòng nhập địa chỉ email hợp lệ, ví dụ: ban@example.com.");
    }
}
