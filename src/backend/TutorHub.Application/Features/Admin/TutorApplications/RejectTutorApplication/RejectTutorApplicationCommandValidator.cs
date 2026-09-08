using FluentValidation;

namespace TutorHub.Application.Features.Admin.TutorApplications.RejectTutorApplication;

public class RejectTutorApplicationCommandValidator
    : AbstractValidator<RejectTutorApplicationCommand>
{
    public RejectTutorApplicationCommandValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Rejection reason is required.")
            .MaximumLength(500);
    }
}
