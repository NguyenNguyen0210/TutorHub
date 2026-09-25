using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
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
    private readonly IClock _clock;
    private readonly IAuditLogService _auditLogService;
    private readonly ICurrentUserService _currentUserService;

    public ResolveReportCommandHandler(IAppDbContext context, IClock clock, IAuditLogService auditLogService, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _auditLogService = auditLogService;
        _currentUserService = currentUserService;
    }

    public async Task<AdminReportDetailDto> Handle(ResolveReportCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

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

        // 1b. Conflict of interest guard (FR-TRUST-003)
        if (report.ReporterUserId == userId)
        {
            throw new ConflictException("Administrators cannot resolve reports they filed themselves.");
        }
        if (report.ReportedUserId == userId)
        {
            if (request.Decision == ReportDecision.SuspendUser)
            {
                throw new ConflictException("Admin cannot suspend their own account.");
            }
            if (request.Decision == ReportDecision.BanUser)
            {
                throw new ConflictException("Admin cannot ban their own account.");
            }
            throw new ConflictException("Administrators cannot resolve reports filed against their own account.");
        }

        var now = _clock.UtcNow;
        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        // 2. Pure Trust & Safety Enforcement (FR-TRUST-004) - Zero Financial Mutation
        // Uses domain transitions + revokes refresh tokens so suspend/ban takes effect immediately.
        if (report.ReportedUserId.HasValue)
        {
            var reportedUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == report.ReportedUserId.Value, cancellationToken);

            if (reportedUser != null)
            {
                // Safety guards: self-lockout & last active admin protection
                if (request.Decision == ReportDecision.SuspendUser || request.Decision == ReportDecision.BanUser)
                {
                    if (reportedUser.Id == userId)
                    {
                        throw new ConflictException(request.Decision == ReportDecision.SuspendUser
                            ? "Admin cannot suspend their own account."
                            : "Admin cannot ban their own account.");
                    }

                    if (reportedUser.Role == UserRole.Admin && reportedUser.Status == AccountStatus.Active)
                    {
                        var activeAdminCount = await _context.Users
                            .CountAsync(u => u.Role == UserRole.Admin && u.Status == AccountStatus.Active, cancellationToken);
                        if (activeAdminCount <= 1)
                        {
                            throw new ConflictException(request.Decision == ReportDecision.SuspendUser
                                ? "Cannot suspend the last active administrator on the platform."
                                : "Cannot ban the last active administrator on the platform.");
                        }
                    }
                }

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
                        userId: userId,
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
                .Include(r => r.Enrollment)
                .FirstOrDefaultAsync(r => r.Id == reviewId, cancellationToken);

            if (review != null && !review.IsRemoved)
            {
                review.RemoveByAdmin(request.Resolution.Trim(), userId);

                // Recalculate TutorProfile RatingAvg & TotalReviews (mirrors AdminModerateReviewCommandHandler)
                if (review.Enrollment != null)
                {
                    var tutorProfileId = review.Enrollment.TutorProfileId;
                    var remainingRatings = await _context.Reviews
                        .AsNoTracking()
                        .Include(r => r.Enrollment)
                        .Where(r => r.Enrollment != null && r.Enrollment.TutorProfileId == tutorProfileId && r.Id != review.Id && !r.IsRemoved)
                        .Select(r => r.Rating)
                        .ToListAsync(cancellationToken);

                    var tutorProfile = await _context.TutorProfiles
                        .FirstOrDefaultAsync(tp => tp.Id == tutorProfileId, cancellationToken);

                    if (tutorProfile != null)
                    {
                        tutorProfile.ApplyReview(remainingRatings);
                    }
                }
            }
        }

        // 3b. Content Removal for Service Violations (FR-TRUST-004)
        if (request.Decision == ReportDecision.RemoveContent &&
            (report.ReportType == TrustReportType.ServiceViolation || report.ReportType == TrustReportType.General) &&
            Guid.TryParse(report.TargetId, out var serviceId))
        {
            var service = await _context.Services
                .FirstOrDefaultAsync(s => s.Id == serviceId, cancellationToken);

            if (service != null && service.Status == ServiceStatus.Published)
            {
                service.Unpublish();

                await _auditLogService.LogAsync(
                    action: "SERVICE_FORCE_UNPUBLISHED",
                    entityName: "Service",
                    entityId: service.Id.ToString(),
                    userId: userId,
                    oldValues: new { status = "Published", source = "TrustReport", reportId = report.Id },
                    newValues: new { status = service.Status.ToString(), resolution = request.Resolution },
                    cancellationToken: cancellationToken);
            }
        }

        // 4. Mark Report Resolved (F-23: domain transition).
        try
        {
            report.Resolve(request.Decision, request.Resolution, userId, now);
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

        // 4b. Warning notification to reported user (FR-TRUST-005)
        if (request.Decision == ReportDecision.WarningIssued && report.ReportedUserId.HasValue)
        {
            _context.AddOutboxMessage(new ReportResolvedEvent(
                report.Id,
                report.ReportedUserId.Value,
                report.ReporterUserId,
                request.Decision.ToString(),
                request.Resolution));
        }

        // 5. Central Append-Only Audit Logging (INV-LEDGER-006)
        await _auditLogService.LogAsync(
            action: $"TrustReportResolved_{request.Decision}",
            entityName: "Report",
            entityId: report.Id.ToString(),
            userId: userId,
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
