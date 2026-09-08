using FluentValidation;

namespace TutorHub.Application.Features.Tutors.Services.CreateService;

public class CreateServiceCommandValidator : AbstractValidator<CreateServiceCommand>
{
    public CreateServiceCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId is required.");

        RuleFor(x => x.SubjectId)
            .NotEmpty().WithMessage("SubjectId is required.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required.")
            .MaximumLength(5000).WithMessage("Description cannot exceed 5000 characters.");

        RuleFor(x => x.LearningScope)
            .MaximumLength(2000).WithMessage("Learning scope cannot exceed 2000 characters.")
            .When(x => !string.IsNullOrEmpty(x.LearningScope));

        RuleFor(x => x.ExpectedOutcome)
            .MaximumLength(2000).WithMessage("Expected outcome cannot exceed 2000 characters.")
            .When(x => !string.IsNullOrEmpty(x.ExpectedOutcome));

        RuleFor(x => x.TotalSessions)
            .GreaterThan(0).WithMessage("Total sessions must be greater than 0.");

        RuleFor(x => x.SessionDurationMinutes)
            .GreaterThan(0).WithMessage("Session duration must be greater than 0 minutes.");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be greater than 0.");

        RuleFor(x => x.TeachingMode)
            .IsInEnum().WithMessage("Invalid teaching mode.");

        RuleFor(x => x.TrialLessonUrl)
            .MaximumLength(1000).WithMessage("Trial lesson URL cannot exceed 1000 characters.")
            .When(x => !string.IsNullOrEmpty(x.TrialLessonUrl));
    }
}
