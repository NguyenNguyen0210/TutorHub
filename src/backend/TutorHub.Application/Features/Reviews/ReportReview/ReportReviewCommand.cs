using MediatR;
using TutorHub.Application.Features.Reports.DTOs;

namespace TutorHub.Application.Features.Reviews.ReportReview;

public record ReportReviewCommand(
    Guid ReviewId,
    string Description,
    string? EvidenceUrl = null
) : IRequest<ReportSummaryDto>;
