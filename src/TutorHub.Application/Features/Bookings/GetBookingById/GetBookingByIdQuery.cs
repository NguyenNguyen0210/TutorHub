using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Bookings.GetBookingById;

public record GetBookingByIdQuery(
    Guid BookingId,
    Guid UserId,
    UserRole Role
) : IRequest<BookingDto>;
