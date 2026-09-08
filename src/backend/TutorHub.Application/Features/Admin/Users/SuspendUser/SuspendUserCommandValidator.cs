using FluentValidation;

namespace TutorHub.Application.Features.Admin.Users.SuspendUser;

public class SuspendUserCommandValidator : AbstractValidator<SuspendUserCommand>
{
    public SuspendUserCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId is required.");

        RuleFor(x => x.AdminId)
            .NotEmpty().WithMessage("AdminId is required.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required to suspend an account.")
            .MaximumLength(500).WithMessage("Reason cannot exceed 500 characters.");
    }
}
