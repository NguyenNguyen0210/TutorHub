using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;

namespace TutorHub.Application.Features.Bookings.CreateBooking;

public record CreateBookingCommand(
    Guid UserId,
    Guid ServiceId
) : IRequest<BookingDto>;
