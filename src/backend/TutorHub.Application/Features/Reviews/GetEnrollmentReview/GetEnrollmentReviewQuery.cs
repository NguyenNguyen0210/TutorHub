using MediatR;
using TutorHub.Application.Features.Reviews.DTOs;

namespace TutorHub.Application.Features.Reviews.GetEnrollmentReview;

public record GetEnrollmentReviewQuery(
    Guid EnrollmentId
) : IRequest<ReviewDto>;
