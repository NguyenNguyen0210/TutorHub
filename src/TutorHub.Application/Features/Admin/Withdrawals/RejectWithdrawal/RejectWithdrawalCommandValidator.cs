using FluentValidation;

namespace TutorHub.Application.Features.Admin.Withdrawals.RejectWithdrawal;

public class RejectWithdrawalCommandValidator : AbstractValidator<RejectWithdrawalCommand>
{
    public RejectWithdrawalCommandValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Rejection reason is required.")
            .MinimumLength(5).WithMessage("Rejection reason must be at least 5 characters.")
            .MaximumLength(500).WithMessage("Rejection reason cannot exceed 500 characters.");
    }
}
