using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;

namespace TutorHub.Application.Features.Bookings.RejectBooking;

public record RejectBookingCommand(
    Guid BookingId,
    Guid UserId,
    string Reason
) : IRequest<BookingDto>;
