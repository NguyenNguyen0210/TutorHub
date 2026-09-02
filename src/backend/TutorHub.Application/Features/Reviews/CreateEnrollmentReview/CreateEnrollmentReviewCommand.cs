using MediatR;
using TutorHub.Application.Features.Reviews.DTOs;

namespace TutorHub.Application.Features.Reviews.CreateEnrollmentReview;

public record CreateEnrollmentReviewCommand(
    Guid EnrollmentId,
    Guid UserId,
    int Rating,
    string? Comment = null
) : IRequest<ReviewDto>;
