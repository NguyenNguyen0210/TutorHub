using FluentValidation;

namespace TutorHub.Application.Features.Enrollments.CancelEnrollment;

public class CancelEnrollmentCommandValidator : AbstractValidator<CancelEnrollmentCommand>
{
    public CancelEnrollmentCommandValidator()
    {
        RuleFor(x => x.EnrollmentId)
            .NotEmpty().WithMessage("EnrollmentId is required.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Cancellation reason is required.")
            .MinimumLength(5).WithMessage("Cancellation reason must be at least 5 characters.")
            .MaximumLength(500).WithMessage("Cancellation reason cannot exceed 500 characters.");
    }
}
