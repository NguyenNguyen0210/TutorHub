using FluentValidation;

namespace TutorHub.Application.Features.Admin.Tutors.SuspendTutor;

public class SuspendTutorCommandValidator : AbstractValidator<SuspendTutorCommand>
{
    public SuspendTutorCommandValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Suspension reason is required.")
            .MaximumLength(500).WithMessage("Suspension reason cannot exceed 500 characters.");
    }
}
