using MediatR;
using TutorHub.Application.Features.Reviews.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Reviews.GetEnrollmentReview;

public record GetEnrollmentReviewQuery(
    Guid EnrollmentId,
    Guid UserId,
    UserRole Role
) : IRequest<ReviewDto>;
