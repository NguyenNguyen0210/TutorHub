namespace TutorHub.Application.Features.Reviews.DTOs;

public record ReportReviewRequest(
    string Description,
    string? EvidenceUrl = null
);
