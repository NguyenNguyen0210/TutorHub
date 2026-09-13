using MediatR;
using TutorHub.Application.Features.Reviews.DTOs;

namespace TutorHub.Application.Features.Reviews.ReplyReview;

public record ReplyReviewCommand(
    Guid ReviewId,
    string Reply
) : IRequest<ReviewDto>;
