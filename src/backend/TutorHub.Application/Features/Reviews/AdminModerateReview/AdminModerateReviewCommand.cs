using MediatR;
using TutorHub.Application.Features.Reviews.DTOs;

namespace TutorHub.Application.Features.Reviews.AdminModerateReview;

public record AdminModerateReviewCommand(
    Guid ReviewId,
    Guid AdminId,
    string Reason
) : IRequest<ReviewDto>;
