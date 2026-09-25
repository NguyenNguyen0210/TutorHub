using FluentValidation;

namespace TutorHub.Application.Features.StudentWallets.Commands.AdminRejectTopUp;

public class AdminRejectTopUpCommandValidator : AbstractValidator<AdminRejectTopUpCommand>
{
    public AdminRejectTopUpCommandValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty()
            .WithMessage("Rejection reason is required.")
            .MaximumLength(500)
            .WithMessage("Rejection reason must not exceed 500 characters.");
    }
}
