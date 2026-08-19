using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Reports.DTOs;

public record ReportSummaryDto(
    Guid Id,
    Guid BookingId,
    Guid ReporterUserId,
    string ReporterName,
    string ReporterRole,
    string Description,
    string? EvidenceUrl,
    ReportStatus Status,
    ReportDecision? AdminDecision,
    DateTime CreatedAt,
    DateTime? ResolvedAt
);
