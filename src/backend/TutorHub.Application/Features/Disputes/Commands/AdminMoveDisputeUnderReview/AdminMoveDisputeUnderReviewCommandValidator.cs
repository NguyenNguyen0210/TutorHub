using FluentValidation;

namespace TutorHub.Application.Features.Disputes.Commands.AdminMoveDisputeUnderReview;

public class AdminMoveDisputeUnderReviewCommandValidator : AbstractValidator<AdminMoveDisputeUnderReviewCommand>
{
    public AdminMoveDisputeUnderReviewCommandValidator()
    {
        RuleFor(x => x.DisputeId).NotEmpty();
    }
}
