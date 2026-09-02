using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.SubmitAttendance;

public record SubmitAttendanceCommand(
    Guid UserId,
    Guid SessionId,
    AttendanceStatus Outcome
) : IRequest<SessionDto>;
