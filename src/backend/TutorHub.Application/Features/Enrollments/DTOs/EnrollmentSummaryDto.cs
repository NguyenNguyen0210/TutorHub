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
    EnrollmentStatus Status,
    DateTime CreatedAt,
    DateTime? CompletedAt,
    DateTime? CancelledAt,
    string? TutorAvatarUrl = null,
    Guid? TutorUserId = null,
    decimal ReleasedAmount = 0,
    decimal RefundedAmount = 0
);
