using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;

namespace TutorHub.Application.Features.Bookings.PayBooking;

public record PayBookingCommand(
    Guid BookingId,
    Guid UserId,
    string? PaymentMethod = "Mock"
) : IRequest<BookingDto>;
