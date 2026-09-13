using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;

namespace TutorHub.Application.Features.Sessions.CancelSession;

public record CancelSessionCommand(
    Guid SessionId,
    string Reason
) : IRequest<SessionDto>;
