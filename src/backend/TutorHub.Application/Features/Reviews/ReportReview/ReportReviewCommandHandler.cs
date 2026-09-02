using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Reports.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Reviews.ReportReview;

public class ReportReviewCommandHandler : IRequestHandler<ReportReviewCommand, ReportSummaryDto>
{
    private readonly IAppDbContext _context;

    public ReportReviewCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<ReportSummaryDto> Handle(ReportReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await _context.Reviews
            .Include(r => r.Enrollment)
            .FirstOrDefaultAsync(r => r.Id == request.ReviewId, cancellationToken);

        if (review == null)
        {
            throw new NotFoundException("Review", request.ReviewId);
        }

        if (review.IsRemoved)
        {
            throw new ConflictException("Cannot report a review that has already been removed.");
        }

        var reporter = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (reporter == null)
        {
            throw new NotFoundException("User", request.UserId);
        }

        var report = new Report
        {
            Id = Guid.NewGuid(),
            BookingId = review.Enrollment.BookingId,
            ReporterUserId = request.UserId,
            Description = $"[Review Violation Report - ReviewId: {review.Id}] {request.Description.Trim()}",
            EvidenceUrl = string.IsNullOrWhiteSpace(request.EvidenceUrl) ? null : request.EvidenceUrl.Trim(),
            Status = ReportStatus.Open,
            CreatedAt = DateTime.UtcNow
        };

        _context.Reports.Add(report);
        await _context.SaveChangesAsync(cancellationToken);

        return new ReportSummaryDto(
            Id: report.Id,
            BookingId: report.BookingId,
            ReporterUserId: report.ReporterUserId,
            ReporterName: reporter.FullName,
            ReporterRole: reporter.Role.ToString(),
            Description: report.Description,
            EvidenceUrl: report.EvidenceUrl,
            Status: report.Status,
            AdminDecision: report.AdminDecision,
            CreatedAt: report.CreatedAt,
            ResolvedAt: report.ResolvedAt
        );
    }
}
