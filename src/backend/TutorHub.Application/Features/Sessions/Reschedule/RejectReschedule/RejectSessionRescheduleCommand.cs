using MediatR;
using TutorHub.Application.Features.Sessions.Reschedule.DTOs;

namespace TutorHub.Application.Features.Sessions.Reschedule.RejectReschedule;

public record RejectSessionRescheduleCommand(
    Guid UserId,
    Guid SessionId,
    Guid RequestId,
    string? RejectionReason
) : IRequest<SessionRescheduleRequestDto>;
