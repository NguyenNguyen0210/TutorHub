using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Bookings.CompleteBooking;

public record CompleteBookingCommand(
    Guid BookingId,
    Guid UserId,
    UserRole Role
) : IRequest<BookingDto>;
