using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;

namespace TutorHub.Application.Features.Sessions.Reschedule.AcceptReschedule;

public record AcceptSessionRescheduleCommand(
    Guid SessionId,
    Guid RequestId
) : IRequest<SessionDto>;
