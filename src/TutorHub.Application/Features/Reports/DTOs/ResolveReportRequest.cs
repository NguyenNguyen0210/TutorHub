using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Reports.DTOs;

public record ResolveReportRequest(
    ReportDecision Decision,
    string Resolution
);
