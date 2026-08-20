using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Reports.DTOs;

public record UserReportDetailDto(
    Guid Id,
    Guid BookingId,
    string Description,
    string? EvidenceUrl,
    ReportStatus Status,
    ReportDecision? AdminDecision,
    string? Resolution,
    DateTime CreatedAt,
    DateTime? ResolvedAt
);
