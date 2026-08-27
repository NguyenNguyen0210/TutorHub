using MediatR;
using TutorHub.Application.Features.Reviews.DTOs;

namespace TutorHub.Application.Features.Reviews.CreateReview;

public record CreateReviewCommand(
    Guid BookingId,
    Guid UserId,
    int Rating,
    string? Comment = null
) : IRequest<BookingReviewDto>;
