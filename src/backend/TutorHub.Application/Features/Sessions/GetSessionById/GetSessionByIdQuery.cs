using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;

namespace TutorHub.Application.Features.Sessions.GetSessionById;

/// <summary>
/// Reads a single session by id. Visible to the Student or Tutor of the owning
/// enrollment, and to Admin (FIN-01 style read scope).
/// </summary>
public record GetSessionByIdQuery(
    Guid SessionId
) : IRequest<SessionDto>;
