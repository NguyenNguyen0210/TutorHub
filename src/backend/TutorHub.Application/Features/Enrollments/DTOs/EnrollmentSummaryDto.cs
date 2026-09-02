using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Enrollments.DTOs;

public record EnrollmentSummaryDto(
    Guid Id,
    Guid BookingId,
    Guid StudentProfileId,
    string StudentName,
    string StudentEmail,
    Guid TutorProfileId,
    string TutorName,
    string TutorEmail,
    Guid ServiceId,
    string ServiceTitle,
    Guid SubjectId,
    string SubjectName,
    decimal TotalPrice,
    int TotalSessions,
    int CompletedSessions,
    int SessionDurationMinutes,
    TeachingMode TeachingMode,
    EnrollmentStatus Status,
    DateTime CreatedAt,
    DateTime? CompletedAt,
    DateTime? CancelledAt
);
