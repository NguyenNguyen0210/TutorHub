using FluentValidation;

namespace TutorHub.Application.Features.Reviews.ReportReview;

public class ReportReviewCommandValidator : AbstractValidator<ReportReviewCommand>
{
    public ReportReviewCommandValidator()
    {
        RuleFor(x => x.ReviewId)
            .NotEmpty().WithMessage("Review ID is required.");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Report description is required.")
            .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters.");

        RuleFor(x => x.EvidenceUrl)
            .MaximumLength(2000).WithMessage("Evidence URL must not exceed 2000 characters.")
            .When(x => !string.IsNullOrEmpty(x.EvidenceUrl));
    }
}
