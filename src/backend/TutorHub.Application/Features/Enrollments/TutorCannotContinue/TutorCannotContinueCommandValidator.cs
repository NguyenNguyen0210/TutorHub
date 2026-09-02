using FluentValidation;

namespace TutorHub.Application.Features.Enrollments.TutorCannotContinue;

public class TutorCannotContinueCommandValidator : AbstractValidator<TutorCannotContinueCommand>
{
    public TutorCannotContinueCommandValidator()
    {
        RuleFor(x => x.EnrollmentId)
            .NotEmpty().WithMessage("EnrollmentId is required.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required.")
            .MinimumLength(5).WithMessage("Reason must be at least 5 characters.")
            .MaximumLength(500).WithMessage("Reason cannot exceed 500 characters.");
    }
}
