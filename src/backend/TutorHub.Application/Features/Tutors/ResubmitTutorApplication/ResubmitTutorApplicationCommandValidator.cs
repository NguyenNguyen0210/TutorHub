using FluentValidation;

namespace TutorHub.Application.Features.Tutors.ResubmitTutorApplication;

public class ResubmitTutorApplicationCommandValidator : AbstractValidator<ResubmitTutorApplicationCommand>
{
    public ResubmitTutorApplicationCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Bio).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.Education).NotEmpty().MaximumLength(1000);
        RuleFor(x => x.ExperienceYears).GreaterThanOrEqualTo(0);
        RuleFor(x => x.TeachingMode).IsInEnum();
    }
}
