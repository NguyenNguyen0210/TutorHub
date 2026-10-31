using FluentValidation;

namespace TutorHub.Application.Features.Auth.VerifyResetOtp;

public class VerifyResetOtpCommandValidator : AbstractValidator<VerifyResetOtpCommand>
{
    public VerifyResetOtpCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Email không đúng định dạng.");

        RuleFor(x => x.Otp)
            .NotEmpty().WithMessage("Mã OTP không được để trống.")
            .Length(6).WithMessage("Mã OTP phải có đúng 6 chữ số.")
            .Matches(@"^[0-9]{6}$").WithMessage("Mã OTP chỉ bao gồm các chữ số.");
    }
}
