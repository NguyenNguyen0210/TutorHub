using FluentValidation;

namespace TutorHub.Application.Features.Enrollments.AdminCancelEnrollment;

public class AdminCancelEnrollmentCommandValidator : AbstractValidator<AdminCancelEnrollmentCommand>
{
    public AdminCancelEnrollmentCommandValidator()
    {
        RuleFor(x => x.EnrollmentId)
            .NotEmpty().WithMessage("EnrollmentId is required.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Administrative cancellation reason is required.")
            .MinimumLength(5).WithMessage("Reason must be at least 5 characters.")
            .MaximumLength(500).WithMessage("Reason cannot exceed 500 characters.");
    }
}
