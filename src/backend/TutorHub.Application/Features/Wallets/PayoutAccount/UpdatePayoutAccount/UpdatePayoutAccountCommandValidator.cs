using FluentValidation;

namespace TutorHub.Application.Features.Wallets.PayoutAccount.UpdatePayoutAccount;

public class UpdatePayoutAccountCommandValidator : AbstractValidator<UpdatePayoutAccountCommand>
{
    public UpdatePayoutAccountCommandValidator()
    {
        RuleFor(x => x.BankName)
            .NotEmpty().WithMessage("Bank name is required.")
            .MaximumLength(100).WithMessage("Bank name cannot exceed 100 characters.");

        RuleFor(x => x.BankCode)
            .MaximumLength(20).WithMessage("Bank code cannot exceed 20 characters.")
            .When(x => !string.IsNullOrEmpty(x.BankCode));

        RuleFor(x => x.AccountNumber)
            .NotEmpty().WithMessage("Account number is required.")
            .MaximumLength(50).WithMessage("Account number cannot exceed 50 characters.");

        RuleFor(x => x.AccountHolderName)
            .NotEmpty().WithMessage("Account holder name is required.")
            .MaximumLength(150).WithMessage("Account holder name cannot exceed 150 characters.");
    }
}
