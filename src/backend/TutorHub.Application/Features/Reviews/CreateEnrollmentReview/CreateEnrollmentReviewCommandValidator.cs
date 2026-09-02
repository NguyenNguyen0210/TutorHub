using FluentValidation;

namespace TutorHub.Application.Features.Reviews.CreateEnrollmentReview;

public class CreateEnrollmentReviewCommandValidator : AbstractValidator<CreateEnrollmentReviewCommand>
{
    public CreateEnrollmentReviewCommandValidator()
    {
        RuleFor(x => x.EnrollmentId)
            .NotEmpty().WithMessage("Enrollment ID is required.");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required.");

        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5.");

        RuleFor(x => x.Comment)
            .MaximumLength(2000).WithMessage("Comment must not exceed 2000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Comment));
    }
}
