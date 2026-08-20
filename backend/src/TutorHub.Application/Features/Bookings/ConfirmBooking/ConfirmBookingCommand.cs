using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;

namespace TutorHub.Application.Features.Bookings.ConfirmBooking;

public record ConfirmBookingCommand(
    Guid BookingId,
    Guid UserId
) : IRequest<BookingDto>;
