using MediatR;
using TutorHub.Application.Features.Reviews.DTOs;

namespace TutorHub.Application.Features.Reviews.ReplyReview;

public record ReplyReviewCommand(
    Guid ReviewId,
    Guid UserId,
    string Reply
) : IRequest<ReviewDto>;
