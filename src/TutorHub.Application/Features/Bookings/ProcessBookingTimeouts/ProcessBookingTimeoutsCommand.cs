using MediatR;

namespace TutorHub.Application.Features.Bookings.ProcessBookingTimeouts;

public record ProcessBookingTimeoutsCommand : IRequest<int>;
