using MediatR;
using TutorHub.Application.Features.Reviews.DTOs;

namespace TutorHub.Application.Features.Reviews.CreateEnrollmentReview;

public record CreateEnrollmentReviewCommand(
    Guid EnrollmentId,
    int Rating,
    string? Comment = null
) : IRequest<ReviewDto>;
