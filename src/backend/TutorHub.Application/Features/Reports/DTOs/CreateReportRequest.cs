namespace TutorHub.Application.Features.Reports.DTOs;

public record CreateReportRequest(
    string Description,
    string? EvidenceUrl = null
);
