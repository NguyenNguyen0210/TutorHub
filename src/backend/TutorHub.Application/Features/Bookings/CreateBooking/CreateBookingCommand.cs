using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;

namespace TutorHub.Application.Features.Bookings.CreateBooking;

public record CreateBookingCommand(
    Guid UserId,
    Guid? ServiceId = null,
    Guid? TutorProfileId = null,
    Guid? SubjectId = null,
    DateTime? StartAt = null,
    DateTime? EndAt = null
) : IRequest<BookingDto>;
