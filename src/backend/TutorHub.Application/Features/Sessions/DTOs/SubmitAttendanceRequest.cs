using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.DTOs;

public record SubmitAttendanceRequest(
    AttendanceStatus Outcome
);
