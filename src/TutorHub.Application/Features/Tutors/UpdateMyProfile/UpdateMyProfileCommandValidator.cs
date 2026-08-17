using FluentValidation;

namespace TutorHub.Application.Features.Tutors.UpdateMyProfile;

public class UpdateMyProfileCommandValidator : AbstractValidator<UpdateMyProfileCommand>
{
    public UpdateMyProfileCommandValidator()
    {
        RuleFor(x => x.Bio)
            .MaximumLength(2000).WithMessage("Bio cannot exceed 2000 characters.");

        RuleFor(x => x.Education)
            .MaximumLength(1000).WithMessage("Education cannot exceed 1000 characters.");

        RuleFor(x => x.ExperienceYears)
            .GreaterThanOrEqualTo(0).WithMessage("Experience years must be 0 or greater.")
            .LessThanOrEqualTo(60).WithMessage("Experience years cannot exceed 60.");

        RuleFor(x => x.HourlyRate)
            .GreaterThanOrEqualTo(0).WithMessage("Hourly rate must be 0 or greater.");

        RuleFor(x => x.TeachingMode)
            .IsInEnum().WithMessage("Valid teaching mode is required.");

        RuleFor(x => x.Address)
            .MaximumLength(500).WithMessage("Address cannot exceed 500 characters.");
    }
}
