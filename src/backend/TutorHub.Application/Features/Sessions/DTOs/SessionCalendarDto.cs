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
    TeachingMode TeachingMode,
    SessionStatus Status
);
