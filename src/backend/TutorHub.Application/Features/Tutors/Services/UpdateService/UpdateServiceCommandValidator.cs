using FluentValidation;

namespace TutorHub.Application.Features.Tutors.Services.UpdateService;

public class UpdateServiceCommandValidator : AbstractValidator<UpdateServiceCommand>
{
    public UpdateServiceCommandValidator()
    {
        RuleFor(x => x.ServiceId)
            .NotEmpty().WithMessage("ServiceId is required.");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId is required.");

        RuleFor(x => x.Title)
            .MaximumLength(200).WithMessage("Title cannot exceed 200 characters.")
            .When(x => !string.IsNullOrEmpty(x.Title));

        RuleFor(x => x.Description)
            .MaximumLength(5000).WithMessage("Description cannot exceed 5000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));

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
    }
}
