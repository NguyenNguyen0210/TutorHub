using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;

namespace TutorHub.Application.Features.Sessions.ScheduleSession;

public record ScheduleSessionCommand(
    Guid UserId,
    Guid SessionId,
    DateTime StartAt,
    DateTime EndAt
) : IRequest<SessionDto>;
