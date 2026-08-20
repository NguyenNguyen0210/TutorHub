using FluentValidation;

namespace TutorHub.Application.Features.Wallets.CreateWithdrawal;

public class CreateWithdrawalCommandValidator : AbstractValidator<CreateWithdrawalCommand>
{
    public CreateWithdrawalCommandValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Withdrawal amount must be greater than zero.")
            .GreaterThanOrEqualTo(50000).WithMessage("Minimum withdrawal amount is 50,000 VND.");

        RuleFor(x => x.BankName)
            .NotEmpty().WithMessage("Bank name is required.")
            .MaximumLength(100).WithMessage("Bank name cannot exceed 100 characters.");

        RuleFor(x => x.AccountNumber)
            .NotEmpty().WithMessage("Account number is required.")
            .MaximumLength(50).WithMessage("Account number cannot exceed 50 characters.");

        RuleFor(x => x.AccountHolderName)
            .NotEmpty().WithMessage("Account holder name is required.")
            .MaximumLength(150).WithMessage("Account holder name cannot exceed 150 characters.");

        RuleFor(x => x.Note)
            .MaximumLength(500).WithMessage("Note cannot exceed 500 characters.");
    }
}
