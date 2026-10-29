using FluentValidation;

namespace TutorHub.Application.Features.Tutors.UpdateMyProfile;

public class UpdateMyProfileCommandValidator : AbstractValidator<UpdateMyProfileCommand>
{
    public UpdateMyProfileCommandValidator()
    {
        RuleFor(x => x.Bio)
            .MaximumLength(2000).When(x => x.Bio != null)
            .WithMessage("Bio cannot exceed 2000 characters.");

        RuleFor(x => x.Education)
            .MaximumLength(1000).When(x => x.Education != null)
            .WithMessage("Education cannot exceed 1000 characters.");

        RuleFor(x => x.ExperienceYears)
            .GreaterThanOrEqualTo(0).When(x => x.ExperienceYears.HasValue)
            .WithMessage("Experience years must be 0 or greater.")
            .LessThanOrEqualTo(60).When(x => x.ExperienceYears.HasValue)
            .WithMessage("Experience years cannot exceed 60.");

    }
}
