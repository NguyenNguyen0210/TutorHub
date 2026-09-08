using MediatR;
using TutorHub.Application.Features.Sessions.Reschedule.DTOs;

namespace TutorHub.Application.Features.Sessions.Reschedule.ProposeReschedule;

public record ProposeSessionRescheduleCommand(
    Guid UserId,
    Guid SessionId,
    DateTime ProposedStartAt,
    DateTime ProposedEndAt,
    string? Reason
) : IRequest<SessionRescheduleRequestDto>;
