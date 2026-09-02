using MediatR;
using TutorHub.Application.Features.Sessions.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.GetMySessions;

public record GetMySessionsQuery(
    Guid UserId,
    UserRole Role,
    SessionStatus? Status = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null
) : IRequest<List<SessionCalendarDto>>;
