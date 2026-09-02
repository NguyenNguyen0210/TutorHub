using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Bookings.DTOs;

public record EnrollmentDto(
    Guid Id,
    Guid BookingId,
    Guid StudentProfileId,
    Guid TutorProfileId,
    Guid ServiceId,
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
    DateTime? CancelledAt,
    CancelledBy? CancelledBy,
    string? CancellationReason,
    List<SessionDto> Sessions
);
