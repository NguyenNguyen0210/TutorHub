using FluentValidation;

namespace TutorHub.Application.Features.StudentWallets.Commands.AdminAdjustWallet;

public class AdminAdjustStudentWalletCommandValidator : AbstractValidator<AdminAdjustStudentWalletCommand>
{
    public AdminAdjustStudentWalletCommandValidator()
    {
        RuleFor(x => x.StudentWalletId).NotEmpty();
        RuleFor(x => x.Direction).IsInEnum();
        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("Adjustment amount must be positive.");
        RuleFor(x => x.Amount).Must(amount => decimal.Truncate(amount) == amount)
            .WithMessage("Số tiền VND phải là số nguyên.");

        RuleFor(x => x.Reason)
            .NotEmpty()
            .WithMessage("Adjustment reason is mandatory.")
            .Must(reason => reason != null && reason.Trim().Length >= 10)
            .WithMessage("Lý do điều chỉnh cần ít nhất 10 ký tự.")
            .MaximumLength(500);
    }
}
