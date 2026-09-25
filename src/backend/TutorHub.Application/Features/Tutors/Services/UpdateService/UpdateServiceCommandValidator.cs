using FluentValidation;
using TutorHub.Application.Features.Tutors.Services.Common;

namespace TutorHub.Application.Features.Tutors.Services.UpdateService;

public class UpdateServiceCommandValidator : AbstractValidator<UpdateServiceCommand>
{
    public UpdateServiceCommandValidator()
    {
        RuleFor(x => x.ServiceId)
            .NotEmpty().WithMessage("ServiceId is required.");

        RuleFor(x => x.Title)
            .MaximumLength(200).WithMessage("Title cannot exceed 200 characters.")
            .When(x => !string.IsNullOrEmpty(x.Title));

        RuleFor(x => x.Description)
            .MaximumLength(5000).WithMessage("Description cannot exceed 5000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.ShortDescription)
            .MaximumLength(200).WithMessage("Short description cannot exceed 200 characters.")
            .When(x => !string.IsNullOrEmpty(x.ShortDescription));

        RuleFor(x => x.Tags)
            .Must(tags => tags!.Length <= 10).WithMessage("Tags cannot exceed 10 items.")
            .When(x => x.Tags != null);

        RuleForEach(x => x.Tags)
            .MaximumLength(30).WithMessage("Each tag cannot exceed 30 characters.")
            .When(x => x.Tags != null);

        RuleFor(x => x.LearningScope)
            .MaximumLength(2000).WithMessage("Learning scope cannot exceed 2000 characters.")
            .When(x => !string.IsNullOrEmpty(x.LearningScope));

        RuleFor(x => x.ExpectedOutcome)
            .MaximumLength(2000).WithMessage("Expected outcome cannot exceed 2000 characters.")
            .When(x => !string.IsNullOrEmpty(x.ExpectedOutcome));

        RuleFor(x => x.TotalSessions)
            .GreaterThan(0).WithMessage("Total sessions must be greater than 0.")
            .When(x => x.TotalSessions.HasValue);

        RuleFor(x => x.SessionDurationMinutes)
            .GreaterThan(0).WithMessage("Session duration must be greater than 0 minutes.")
            .When(x => x.SessionDurationMinutes.HasValue);

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be greater than 0.")
            .When(x => x.Price.HasValue);

        RuleFor(x => x.TeachingMode)
            .IsInEnum().WithMessage("Invalid teaching mode.")
            .When(x => x.TeachingMode.HasValue);

        RuleFor(x => x.TrialLessonUrl)
            .MaximumLength(1000).WithMessage("Trial lesson URL cannot exceed 1000 characters.")
            .When(x => !string.IsNullOrEmpty(x.TrialLessonUrl));

        RuleFor(x => x.CoverImageUrl)
            .MaximumLength(1000).WithMessage("Cover image URL cannot exceed 1000 characters.")
            .When(x => !string.IsNullOrEmpty(x.CoverImageUrl));

        // Collection size vs TotalSessions is only checkable here when both are
        // supplied; the handler enforces the count against the effective
        // (post-update) TotalSessions in all cases.
        RuleFor(x => x.Curriculum)
            .Must((command, curriculum) => curriculum!.Count <= command.TotalSessions!.Value)
            .WithMessage("Curriculum cannot have more items than total sessions.")
            .When(x => x.Curriculum != null && x.TotalSessions.HasValue);

        RuleFor(x => x.Curriculum)
            .Must((command, curriculum) => curriculum!.All(i => i.SessionIndex <= command.TotalSessions!.Value))
            .WithMessage("Curriculum session index cannot exceed total sessions.")
            .When(x => x.Curriculum != null && x.TotalSessions.HasValue);

        RuleFor(x => x.Curriculum)
            .Must(curriculum => curriculum!.Select(i => i.SessionIndex).Distinct().Count() == curriculum!.Count)
            .WithMessage("Curriculum session indexes must be unique.")
            .When(x => x.Curriculum != null);

        RuleForEach(x => x.Curriculum)
            .SetValidator(new CurriculumItemInputValidator())
            .When(x => x.Curriculum != null);

        RuleFor(x => x.TargetAudience)
            .Must(audience => audience!.Count <= 8).WithMessage("Target audience cannot exceed 8 items.")
            .When(x => x.TargetAudience != null);

        RuleForEach(x => x.TargetAudience)
            .NotEmpty().WithMessage("Target audience entry cannot be empty.")
            .MaximumLength(200).WithMessage("Each target audience entry cannot exceed 200 characters.")
            .When(x => x.TargetAudience != null);

        RuleFor(x => x.Prerequisites)
            .Must(prerequisites => prerequisites!.Count <= 8).WithMessage("Prerequisites cannot exceed 8 items.")
            .When(x => x.Prerequisites != null);

        RuleForEach(x => x.Prerequisites)
            .NotEmpty().WithMessage("Prerequisite entry cannot be empty.")
            .MaximumLength(200).WithMessage("Each prerequisite entry cannot exceed 200 characters.")
            .When(x => x.Prerequisites != null);

        RuleFor(x => x.Faqs)
            .Must(faqs => faqs!.Count <= 10).WithMessage("FAQs cannot exceed 10 items.")
            .When(x => x.Faqs != null);

        RuleForEach(x => x.Faqs)
            .SetValidator(new FaqInputValidator())
            .When(x => x.Faqs != null);
    }
}
