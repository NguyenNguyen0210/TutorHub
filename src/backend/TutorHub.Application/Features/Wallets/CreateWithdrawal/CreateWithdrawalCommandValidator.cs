using FluentValidation;

namespace TutorHub.Application.Features.Wallets.CreateWithdrawal;

public class CreateWithdrawalCommandValidator : AbstractValidator<CreateWithdrawalCommand>
{
    public CreateWithdrawalCommandValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Withdrawal amount must be greater than zero.");

        // "All-or-Nothing" Payout Destination Validation (DEC-WD-002)
        When(x => !string.IsNullOrWhiteSpace(x.BankName) ||
                  !string.IsNullOrWhiteSpace(x.AccountNumber) ||
                  !string.IsNullOrWhiteSpace(x.AccountHolderName), () =>
        {
            RuleFor(x => x.BankName)
                .NotEmpty().WithMessage("Bank name is required when providing custom payout destination.")
                .MaximumLength(100).WithMessage("Bank name cannot exceed 100 characters.");

            RuleFor(x => x.BankCode)
                .MaximumLength(20).WithMessage("Bank code cannot exceed 20 characters.")
                .When(x => !string.IsNullOrEmpty(x.BankCode));

            RuleFor(x => x.AccountNumber)
                .NotEmpty().WithMessage("Account number is required when providing custom payout destination.")
                .MaximumLength(50).WithMessage("Account number cannot exceed 50 characters.");

            RuleFor(x => x.AccountHolderName)
                .NotEmpty().WithMessage("Account holder name is required when providing custom payout destination.")
                .MaximumLength(150).WithMessage("Account holder name cannot exceed 150 characters.");
        });

        RuleFor(x => x.Note)
            .MaximumLength(500).WithMessage("Note cannot exceed 500 characters.");
    }
}
