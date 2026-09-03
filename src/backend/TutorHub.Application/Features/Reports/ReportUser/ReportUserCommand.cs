using MediatR;
using TutorHub.Application.Features.Reports.DTOs;

namespace TutorHub.Application.Features.Reports.ReportUser;

public record ReportUserCommand(
    Guid ReporterUserId,
    Guid TargetUserId,
    string Reason,
    string? EvidenceUrl = null
) : IRequest<ReportSummaryDto>;
