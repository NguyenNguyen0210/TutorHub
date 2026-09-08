using FluentValidation;

namespace TutorHub.Application.Features.Admin.Withdrawals.FailWithdrawal;

public class FailWithdrawalCommandValidator : AbstractValidator<FailWithdrawalCommand>
{
    public FailWithdrawalCommandValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Failure reason is mandatory.")
            .MaximumLength(500).WithMessage("Failure reason cannot exceed 500 characters.");
    }
}
