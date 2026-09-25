using FluentValidation;

namespace TutorHub.Application.Features.Admin.Users.UnbanUser;

public class UnbanUserCommandValidator : AbstractValidator<UnbanUserCommand>
{
    public UnbanUserCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("UserId is required.");

        RuleFor(x => x.Reason)
            .NotEmpty()
            .WithMessage("Unban reason is required.")
            .MaximumLength(500)
            .WithMessage("Unban reason cannot exceed 500 characters.");
    }
}
