using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;

namespace TutorHub.Application.Features.Bookings.GetBookingById;

public record GetBookingByIdQuery(
    Guid BookingId
) : IRequest<BookingDto>;
