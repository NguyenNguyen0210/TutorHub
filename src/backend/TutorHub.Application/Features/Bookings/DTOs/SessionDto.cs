using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Bookings.DTOs;

public record SessionDto(
    Guid Id,
    Guid EnrollmentId,
    int SessionNumber,
    decimal EarningAmount,
    DateTime? StartAt,
    DateTime? EndAt,
    SessionStatus Status,
    bool IsPayoutReleased,
    DateTime CreatedAt,
    DateTime? CompletedAt,
    DateTime? CancelledAt,
    AttendanceStatus? StudentAttendance = null,
    AttendanceStatus? TutorAttendance = null,
    bool HasAttendanceConflict = false
);
