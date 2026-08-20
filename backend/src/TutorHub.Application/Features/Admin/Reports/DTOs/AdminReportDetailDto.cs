using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Reports.DTOs;

public record AdminReportDetailDto(
    Guid Id,
    Guid BookingId,
    Guid ReporterUserId,
    string ReporterName,
    string ReporterRole,
    string Description,
    string? EvidenceUrl,
    ReportStatus Status,
    ReportDecision? AdminDecision,
    string? Resolution,
    Guid? ResolvedByAdminId,
    string? ResolvedByAdminName,
    DateTime CreatedAt,
    DateTime? ResolvedAt,
    BookingSummaryDto Booking,
    string StudentName,
    string StudentEmail,
    string? StudentPhone,
    string TutorName,
    string TutorEmail,
    string? TutorPhone
);
