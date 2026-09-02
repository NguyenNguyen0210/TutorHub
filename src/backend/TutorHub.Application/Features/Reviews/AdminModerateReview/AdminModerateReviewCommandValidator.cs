using FluentValidation;

namespace TutorHub.Application.Features.Reviews.AdminModerateReview;

public class AdminModerateReviewCommandValidator : AbstractValidator<AdminModerateReviewCommand>
{
    public AdminModerateReviewCommandValidator()
    {
        RuleFor(x => x.ReviewId)
            .NotEmpty().WithMessage("Review ID is required.");

        RuleFor(x => x.AdminId)
            .NotEmpty().WithMessage("Admin ID is required.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Moderation removal reason is required.")
            .MaximumLength(500).WithMessage("Removal reason must not exceed 500 characters.");
    }
}
