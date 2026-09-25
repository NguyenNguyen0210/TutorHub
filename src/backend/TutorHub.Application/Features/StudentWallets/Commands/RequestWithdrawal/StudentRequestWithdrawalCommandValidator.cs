using FluentValidation;

namespace TutorHub.Application.Features.StudentWallets.Commands.RequestWithdrawal;

public class StudentRequestWithdrawalCommandValidator : AbstractValidator<StudentRequestWithdrawalCommand>
{
    public StudentRequestWithdrawalCommandValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThanOrEqualTo(50_000m)
            .WithMessage("Withdrawal amount must be at least 50,000 VND.");

        RuleFor(x => x.BankName)
            .NotEmpty()
            .WithMessage("Bank name is required.")
            .MaximumLength(100);

        RuleFor(x => x.AccountNumber)
            .NotEmpty()
            .WithMessage("Account number is required.")
            .MaximumLength(50);

        RuleFor(x => x.AccountHolderName)
            .NotEmpty()
            .WithMessage("Account holder name is required.")
            .MaximumLength(150);

        RuleFor(x => x.Note)
            .MaximumLength(500);
    }
}
