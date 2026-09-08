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
        // Uses domain transitions + revokes refresh tokens so suspend/ban takes effect immediately.
        if (report.ReportedUserId.HasValue)
        {
            var reportedUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == report.ReportedUserId.Value, cancellationToken);

            if (reportedUser != null)
            {
                try
                {
                    if (request.Decision == ReportDecision.SuspendUser)
                    {
                        reportedUser.Suspend();
                    }
                    else if (request.Decision == ReportDecision.BanUser)
                    {
                        reportedUser.Ban();
                    }
                }
                catch (InvalidOperationException ex)
                {
                    throw new ConflictException(ex.Message);
                }

                if (request.Decision == ReportDecision.SuspendUser || request.Decision == ReportDecision.BanUser)
                {
                    var activeTokens = await _context.RefreshTokens
                        .Where(t => t.UserId == reportedUser.Id && t.RevokedAt == null && t.ExpiresAt > now)
                        .ToListAsync(cancellationToken);
                    foreach (var token in activeTokens)
                    {
                        token.RevokedAt = now;
                    }

                    await _auditLogService.LogAsync(
                        action: request.Decision == ReportDecision.SuspendUser ? "USER_SUSPENDED" : "USER_BANNED",
                        entityName: "User",
                        entityId: reportedUser.Id.ToString(),
                        userId: request.AdminId,
                        oldValues: new { source = "TrustReport", reportId = report.Id },
                        newValues: new { status = reportedUser.Status.ToString(), reportId = report.Id },
                        cancellationToken: cancellationToken);
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

        // 4. Mark Report Resolved (F-23: domain transition).
        try
        {
            report.Resolve(request.Decision, request.Resolution, request.AdminId);
        }
        catch (ArgumentException ex)
        {
            throw new BadRequestException(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            throw new ConflictException(ex.Message);
        }

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
