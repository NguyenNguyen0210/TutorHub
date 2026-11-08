using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.DTOs;

public record SessionCalendarDto(
    Guid Id,
    Guid EnrollmentId,
    int SessionNumber,
    string SubjectName,
    string StudentName,
    string TutorName,
    DateTime? StartAt,
    DateTime? EndAt,
    int DurationMinutes,
    SessionStatus Status,
    // Grace-period state is part of the calendar contract so clients do not have to
    // fetch every AwaitingPayout session individually to render its countdown.
    DateTime? GracePeriodEndsAt = null,
    bool HasIssueReport = false
);
