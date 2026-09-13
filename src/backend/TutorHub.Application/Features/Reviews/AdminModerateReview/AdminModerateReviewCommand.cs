using MediatR;
using TutorHub.Application.Features.Reviews.DTOs;

namespace TutorHub.Application.Features.Reviews.AdminModerateReview;

public record AdminModerateReviewCommand(
    Guid ReviewId,
    string Reason
) : IRequest<ReviewDto>;
