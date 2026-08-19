using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Reports.DTOs;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Reports.ResolveReport;

public class ResolveReportCommandHandler : IRequestHandler<ResolveReportCommand, AdminReportDetailDto>
{
    private readonly IAppDbContext _context;

    public ResolveReportCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminReportDetailDto> Handle(ResolveReportCommand request, CancellationToken cancellationToken)
    {
        var report = await _context.Reports
            .Include(r => r.ReporterUser)
            .Include(r => r.ResolvedByAdmin)
            .Include(r => r.Booking).ThenInclude(b => b.StudentProfile).ThenInclude(s => s.User)
            .Include(r => r.Booking).ThenInclude(b => b.TutorProfile).ThenInclude(t => t.User)
            .Include(r => r.Booking).ThenInclude(b => b.Subject)
            .Include(r => r.Booking).ThenInclude(b => b.Transaction)
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

        // 2. Financial & Lifecycle Execution if RefundStudent is decided
        if (request.Decision == ReportDecision.RefundStudent && report.Booking.Transaction != null)
        {
            var transaction = report.Booking.Transaction;
            if (transaction.Status != TransactionStatus.Refunded)
            {
                var wallet = await _context.Wallets
                    .FirstOrDefaultAsync(w => w.TutorProfileId == report.Booking.TutorProfileId, cancellationToken);

                if (report.Booking.Status == BookingStatus.Completed)
                {
                    // Tutor already received payout in AvailableBalance
                    if (wallet != null)
                    {
                        wallet.AvailableBalance = Math.Max(0, wallet.AvailableBalance - transaction.PayoutAmount);
                        wallet.UpdatedAt = now;
                    }
                }
                else if (report.Booking.Status == BookingStatus.Confirmed)
                {
                    // Funds are in PendingBalance
                    if (wallet != null)
                    {
                        wallet.PendingBalance = Math.Max(0, wallet.PendingBalance - transaction.Amount);
                        wallet.UpdatedAt = now;
                    }
                }

                transaction.Status = TransactionStatus.Refunded;
                transaction.RefundedAt = now;

                report.Booking.Status = BookingStatus.Cancelled;
                report.Booking.CancelledAt = now;
                report.Booking.CancelledBy = CancelledBy.Admin;
                var reason = $"Dispute resolved by Admin: {request.Resolution.Trim()}";
                report.Booking.CancellationReason = reason.Length > 500 ? reason[..500] : reason;
            }
        }

        // 3. Mark Report Resolved
        report.Status = ReportStatus.Resolved;
        report.AdminDecision = request.Decision;
        report.Resolution = request.Resolution.Trim();
        report.ResolvedAt = now;
        report.ResolvedByAdminId = request.AdminId;
        report.ResolvedByAdmin = admin;

        await _context.SaveChangesAsync(cancellationToken);

        var booking = report.Booking;
        var studentUser = booking.StudentProfile?.User;
        var tutorUser = booking.TutorProfile?.User;
        var reporterRole = report.ReporterUserId == studentUser?.Id ? "Student" : "Tutor";

        var bookingSummary = new BookingSummaryDto(
            Id: booking.Id,
            StudentProfileId: booking.StudentProfileId,
            StudentName: studentUser?.FullName ?? string.Empty,
            TutorProfileId: booking.TutorProfileId,
            TutorName: tutorUser?.FullName ?? string.Empty,
            SubjectId: booking.SubjectId,
            SubjectName: booking.Subject?.Name ?? string.Empty,
            StartAt: booking.StartAt,
            EndAt: booking.EndAt,
            TotalAmount: booking.TotalAmount,
            Status: booking.Status,
            CreatedAt: booking.CreatedAt
        );

        return new AdminReportDetailDto(
            Id: report.Id,
            BookingId: report.BookingId,
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
            StudentName: studentUser?.FullName ?? string.Empty,
            StudentEmail: studentUser?.Email ?? string.Empty,
            StudentPhone: studentUser?.Phone,
            TutorName: tutorUser?.FullName ?? string.Empty,
            TutorEmail: tutorUser?.Email ?? string.Empty,
            TutorPhone: tutorUser?.Phone
        );
    }
}
