using MediatR;
using TutorHub.Application.Features.Sessions.Reschedule.DTOs;

namespace TutorHub.Application.Features.Sessions.Reschedule.GetRescheduleRequests;

public record GetSessionRescheduleRequestsQuery(
    Guid UserId,
    Guid SessionId
) : IRequest<List<SessionRescheduleRequestDto>>;
