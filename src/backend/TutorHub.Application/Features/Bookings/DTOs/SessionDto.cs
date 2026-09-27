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
    DateTime? GracePeriodStartedAt = null,
    DateTime? GracePeriodEndsAt = null,
    bool HasIssueReport = false,
    string? IssueReportReason = null,
    DateTime? IssueReportedAt = null,
    string? TutorName = null,
    string? SubjectName = null
);
