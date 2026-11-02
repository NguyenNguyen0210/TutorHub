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

        RuleFor(x => x.University).MaximumLength(255);
        RuleFor(x => x.Major).MaximumLength(255);
        RuleFor(x => x.DegreeLevel).MaximumLength(100);
        RuleFor(x => x.Certifications).MaximumLength(500);
        RuleFor(x => x.Subject).MaximumLength(100);
        RuleFor(x => x.SubjectSub).MaximumLength(150);
        RuleFor(x => x.Methodology).MaximumLength(2000);
        RuleFor(x => x.Achievements).MaximumLength(2000);
        RuleFor(x => x.DocumentIds).Must(ids => ids == null || ids.Count <= 20);
    }
}
