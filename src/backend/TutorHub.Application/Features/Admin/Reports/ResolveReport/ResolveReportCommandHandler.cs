using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Reports.DTOs;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Reports.ResolveReport;

public class ResolveReportCommandHandler : IRequestHandler<ResolveReportCommand, AdminReportDetailDto>
{
    private readonly IAppDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public ResolveReportCommandHandler(IAppDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    public async Task<AdminReportDetailDto> Handle(ResolveReportCommand request, CancellationToken cancellationToken)
    {
        var report = await _context.Reports
            .Include(r => r.ReporterUser)
            .Include(r => r.ReportedUser)
            .Include(r => r.ResolvedByAdmin)
            .Include(r => r.Booking).ThenInclude(b => b!.StudentProfile).ThenInclude(s => s.User)
            .Include(r => r.Booking).ThenInclude(b => b!.TutorProfile).ThenInclude(t => t.User)
            .Include(r => r.Booking).ThenInclude(b => b!.Subject)
            .FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken);

        if (report == null)
        {
            throw new NotFoundException("Report", request.Id);
        }

        // 1. State transition guard
        if (report.Status != ReportStatus.Open)
        {
            throw new ConflictException("Report has already been resolved.");
        }

        var now = DateTime.UtcNow;
        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.AdminId, cancellationToken);

        // 2. Pure Trust & Safety Enforcement (FR-TRUST-004) - Zero Financial Mutation
        if (report.ReportedUserId.HasValue)
        {
            var reportedUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == report.ReportedUserId.Value, cancellationToken);

            if (reportedUser != null)
            {
                if (request.Decision == ReportDecision.SuspendUser)
                {
                    reportedUser.Status = AccountStatus.Suspended;
                }
                else if (request.Decision == ReportDecision.BanUser)
                {
                    reportedUser.Status = AccountStatus.Banned;
                }
            }
        }

        // 3. Content Removal for Review Violations
        if (request.Decision == ReportDecision.RemoveContent &&
            report.ReportType == TrustReportType.ReviewViolation &&
            Guid.TryParse(report.TargetId, out var reviewId))
        {
            var review = await _context.Reviews
                .FirstOrDefaultAsync(r => r.Id == reviewId, cancellationToken);

            if (review != null && !review.IsRemoved)
            {
                review.RemoveByAdmin(request.Resolution.Trim(), request.AdminId);
            }
        }

        // 4. Mark Report Resolved
        report.Status = ReportStatus.Resolved;
        report.AdminDecision = request.Decision;
        report.Resolution = request.Resolution.Trim();
        report.ResolvedAt = now;
        report.ResolvedByAdminId = request.AdminId;
        report.ResolvedByAdmin = admin;

        // 5. Central Append-Only Audit Logging (INV-LEDGER-006)
        await _auditLogService.LogAsync(
            action: $"TrustReportResolved_{request.Decision}",
            entityName: "Report",
            entityId: report.Id.ToString(),
            userId: request.AdminId,
            newValues: new { Decision = request.Decision.ToString(), Resolution = request.Resolution },
            cancellationToken: cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        var booking = report.Booking;
        var studentUser = booking?.StudentProfile?.User;
        var tutorUser = booking?.TutorProfile?.User;
        var reporterRole = report.ReporterUserId == studentUser?.Id ? "Student" : (report.ReporterUserId == tutorUser?.Id ? "Tutor" : "User");

        BookingSummaryDto? bookingSummary = null;
        if (booking != null)
        {
            bookingSummary = new BookingSummaryDto(
                Id: booking.Id,
                StudentProfileId: booking.StudentProfileId,
                StudentName: studentUser?.FullName ?? string.Empty,
                TutorProfileId: booking.TutorProfileId,
                TutorName: tutorUser?.FullName ?? string.Empty,
                SubjectId: booking.SubjectId,
                SubjectName: booking.Subject?.Name ?? string.Empty,
                ServiceId: booking.ServiceId,
                TotalPrice: booking.TotalPrice,
                TotalSessions: booking.TotalSessions,
                Status: booking.Status,
                CreatedAt: booking.CreatedAt
            );
        }

        return new AdminReportDetailDto(
            Id: report.Id,
            BookingId: report.BookingId,
            ReportType: report.ReportType,
            ReportedUserId: report.ReportedUserId,
            ReportedUserName: report.ReportedUser?.FullName,
            ReportedUserEmail: report.ReportedUser?.Email,
            TargetId: report.TargetId,
            ReporterUserId: report.ReporterUserId,
            ReporterName: report.ReporterUser?.FullName ?? string.Empty,
            ReporterRole: reporterRole,
            Description: report.Description,
            EvidenceUrl: report.EvidenceUrl,
            Status: report.Status,
            AdminDecision: report.AdminDecision,
            Resolution: report.Resolution,
            ResolvedByAdminId: report.ResolvedByAdminId,
            ResolvedByAdminName: admin?.FullName,
            CreatedAt: report.CreatedAt,
            ResolvedAt: report.ResolvedAt,
            Booking: bookingSummary,
            StudentName: studentUser?.FullName,
            StudentEmail: studentUser?.Email,
            StudentPhone: studentUser?.Phone,
            TutorName: tutorUser?.FullName,
            TutorEmail: tutorUser?.Email,
            TutorPhone: tutorUser?.Phone
        );
    }
}
