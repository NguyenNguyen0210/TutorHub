using FluentValidation;

namespace TutorHub.Application.Features.Reviews.ReplyReview;

public class ReplyReviewCommandValidator : AbstractValidator<ReplyReviewCommand>
{
    public ReplyReviewCommandValidator()
    {
        RuleFor(x => x.ReviewId)
            .NotEmpty().WithMessage("Review ID is required.");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required.");

        RuleFor(x => x.Reply)
            .NotEmpty().WithMessage("Reply text cannot be empty.")
            .MaximumLength(2000).WithMessage("Reply text must not exceed 2000 characters.");
    }
}
