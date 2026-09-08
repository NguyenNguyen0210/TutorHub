using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
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
            .Include(r => r.Enrollment).ThenInclude(e => e.StudentProfile)
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

        var reportedUserId = review.Enrollment?.StudentProfile?.UserId;

        Report report;
        try
        {
            // F-23: validated construction lives in the domain.
            report = Report.Create(
                reporterUserId: request.UserId,
                reportType: TrustReportType.ReviewViolation,
                description: $"[Review Violation Report - ReviewId: {review.Id}] {request.Description}",
                bookingId: review.Enrollment?.BookingId,
                reportedUserId: reportedUserId,
                targetId: review.Id.ToString(),
                evidenceUrl: request.EvidenceUrl);
        }
        catch (ArgumentException ex)
        {
            throw new BadRequestException(ex.Message);
        }

        _context.Reports.Add(report);

        if (reportedUserId.HasValue)
        {
            _context.AddOutboxMessage(new TutorHub.Application.Common.Events.ReportCreatedEvent(
                report.Id,
                reporter.Id,
                reportedUserId.Value,
                report.Description));
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new ReportSummaryDto(
            Id: report.Id,
            BookingId: report.BookingId,
            ReportType: report.ReportType,
            ReportedUserId: report.ReportedUserId,
            TargetId: report.TargetId,
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
