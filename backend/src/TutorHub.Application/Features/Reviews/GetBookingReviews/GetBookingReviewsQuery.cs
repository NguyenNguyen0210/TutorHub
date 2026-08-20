using MediatR;
using TutorHub.Application.Features.Reviews.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Reviews.GetBookingReviews;

public record GetBookingReviewsQuery(
    Guid BookingId,
    Guid UserId,
    UserRole Role
) : IRequest<IReadOnlyList<BookingReviewDto>>;
