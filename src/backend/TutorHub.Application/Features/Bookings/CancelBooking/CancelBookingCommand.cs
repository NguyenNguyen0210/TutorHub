using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Bookings.CancelBooking;

public record CancelBookingCommand(
    Guid BookingId,
    Guid UserId,
    UserRole Role,
    string Reason
) : IRequest<BookingDto>;
