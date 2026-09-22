using FluentValidation;

namespace TutorHub.Application.Features.StudentWallets.Commands.AdminAdjustWallet;

public class AdminAdjustStudentWalletCommandValidator : AbstractValidator<AdminAdjustStudentWalletCommand>
{
    public AdminAdjustStudentWalletCommandValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("Adjustment amount must be positive.");

        RuleFor(x => x.Reason)
            .NotEmpty()
            .WithMessage("Adjustment reason is mandatory.")
            .MaximumLength(500);
    }
}
