using MediatR;
using TutorHub.Application.Features.Reports.DTOs;

namespace TutorHub.Application.Features.Reviews.ReportReview;

public record ReportReviewCommand(
    Guid ReviewId,
    Guid UserId,
    string Description,
    string? EvidenceUrl = null
) : IRequest<ReportSummaryDto>;
