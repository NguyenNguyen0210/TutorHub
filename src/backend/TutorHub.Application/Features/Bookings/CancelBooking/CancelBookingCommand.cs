using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;

namespace TutorHub.Application.Features.Bookings.CancelBooking;

public record CancelBookingCommand(
    Guid BookingId,
    string Reason
) : IRequest<BookingDto>;
