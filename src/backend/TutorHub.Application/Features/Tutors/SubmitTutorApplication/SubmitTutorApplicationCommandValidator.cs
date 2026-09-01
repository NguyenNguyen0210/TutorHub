using FluentValidation;

namespace TutorHub.Application.Features.Tutors.SubmitTutorApplication;

public class SubmitTutorApplicationCommandValidator
    : AbstractValidator<SubmitTutorApplicationCommand>
{
    public SubmitTutorApplicationCommandValidator()
    {
        RuleFor(x => x.Bio)
            .NotEmpty().WithMessage("Bio is required.")
            .MaximumLength(2000);

        RuleFor(x => x.Education)
            .NotEmpty().WithMessage("Education details are required.")
            .MaximumLength(1000);

        RuleFor(x => x.ExperienceYears)
            .GreaterThanOrEqualTo(0).WithMessage("Experience years must be 0 or more.");

        RuleFor(x => x.Address)
            .MaximumLength(500).When(x => x.Address != null);
    }
}
