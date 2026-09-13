using MediatR;
using TutorHub.Application.Features.Admin.Reports.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Reports.ResolveReport;

public record ResolveReportCommand(
    Guid Id,
    ReportDecision Decision,
    string Resolution
) : IRequest<AdminReportDetailDto>;
