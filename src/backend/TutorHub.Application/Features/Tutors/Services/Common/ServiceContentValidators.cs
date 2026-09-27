using FluentValidation;
using TutorHub.Application.Features.Tutors.Services.DTOs;

namespace TutorHub.Application.Features.Tutors.Services.Common;

/// <summary>
/// Item-level validators shared by the CreateService and UpdateService
/// validators so per-session curriculum and FAQ rules stay identical.
/// </summary>
public class CurriculumItemInputValidator : AbstractValidator<CurriculumItemInput>
{
    public CurriculumItemInputValidator()
    {
        RuleFor(x => x.SessionIndex)
            .GreaterThanOrEqualTo(1).WithMessage("Session index must be 1-based.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Curriculum item title is required.")
            .MaximumLength(200).WithMessage("Curriculum item title cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Curriculum item description cannot exceed 2000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.KeyTopics)
            .Must(topics => topics!.Count <= 8).WithMessage("Key topics cannot exceed 8 items.")
            .When(x => x.KeyTopics != null);

        RuleForEach(x => x.KeyTopics)
            .NotEmpty().WithMessage("Key topic cannot be empty.")
            .MaximumLength(100).WithMessage("Each key topic cannot exceed 100 characters.")
            .When(x => x.KeyTopics != null);

        RuleFor(x => x.DurationMinutes)
            .InclusiveBetween(30, 240).WithMessage("Session duration must be between 30 and 240 minutes.")
            .When(x => x.DurationMinutes.HasValue);
    }
}

public class FaqInputValidator : AbstractValidator<FaqInput>
{
    public FaqInputValidator()
    {
        RuleFor(x => x.Question)
            .NotEmpty().WithMessage("FAQ question is required.")
            .MaximumLength(300).WithMessage("FAQ question cannot exceed 300 characters.");

        RuleFor(x => x.Answer)
            .NotEmpty().WithMessage("FAQ answer is required.")
            .MaximumLength(2000).WithMessage("FAQ answer cannot exceed 2000 characters.");
    }
}
