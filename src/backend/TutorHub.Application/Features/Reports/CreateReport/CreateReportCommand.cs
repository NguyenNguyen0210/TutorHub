using MediatR;
using TutorHub.Application.Features.Reports.DTOs;

namespace TutorHub.Application.Features.Reports.CreateReport;

public record CreateReportCommand(
    Guid BookingId,
    Guid UserId,
    string Description,
    string? EvidenceUrl = null
) : IRequest<ReportSummaryDto>;
