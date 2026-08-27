using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Dashboard.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Dashboard.GetAdminDashboardStats;

public class GetAdminDashboardStatsQueryHandler : IRequestHandler<GetAdminDashboardStatsQuery, AdminDashboardStatsDto>
{
    private readonly IAppDbContext _context;

    public GetAdminDashboardStatsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminDashboardStatsDto> Handle(GetAdminDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        // 1. Grouped Users Metrics
        var userGroup = await _context.Users
            .AsNoTracking()
            .GroupBy(u => new { u.Role, u.IsActive })
            .Select(g => new { g.Key.Role, g.Key.IsActive, Count = g.Count() })
            .ToListAsync(cancellationToken);

        int totalUsers = userGroup.Sum(g => g.Count);
        int totalStudents = userGroup.Where(g => g.Role == UserRole.Student).Sum(g => g.Count);
        int totalTutors = userGroup.Where(g => g.Role == UserRole.Tutor).Sum(g => g.Count);
        int activeUsers = userGroup.Where(g => g.IsActive).Sum(g => g.Count);

        var usersStats = new UserStatsDto(
            TotalUsers: totalUsers,
            TotalStudents: totalStudents,
            TotalTutors: totalTutors,
            ActiveUsers: activeUsers
        );

        // 2. Grouped Tutors Metrics
        var tutorGroup = await _context.TutorProfiles
            .AsNoTracking()
            .GroupBy(t => t.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        int verifiedTutors = tutorGroup.FirstOrDefault(g => g.Status == TutorProfileStatus.Verified)?.Count ?? 0;
        int pendingReviewTutors = tutorGroup.FirstOrDefault(g => g.Status == TutorProfileStatus.PendingReview)?.Count ?? 0;
        int draftTutors = tutorGroup.FirstOrDefault(g => g.Status == TutorProfileStatus.Draft)?.Count ?? 0;
        int rejectedTutors = tutorGroup.FirstOrDefault(g => g.Status == TutorProfileStatus.Rejected)?.Count ?? 0;
        int suspendedTutors = tutorGroup.FirstOrDefault(g => g.Status == TutorProfileStatus.Suspended)?.Count ?? 0;

        var tutorsStats = new TutorStatsDto(
            VerifiedTutors: verifiedTutors,
            PendingReviewTutors: pendingReviewTutors,
            DraftTutors: draftTutors,
            RejectedTutors: rejectedTutors,
            SuspendedTutors: suspendedTutors
        );

        // 3. Grouped Bookings Metrics
        var nowUtc = DateTime.UtcNow;
        var holdingCutoff = nowUtc.AddMinutes(-15);

        var bookingGroup = await _context.Bookings
            .AsNoTracking()
            .GroupBy(b => b.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        int totalBookings = bookingGroup.Sum(g => g.Count);
        int pendingBookings = bookingGroup.FirstOrDefault(g => g.Status == BookingStatus.Pending)?.Count ?? 0;
        int confirmedBookings = bookingGroup.FirstOrDefault(g => g.Status == BookingStatus.Confirmed)?.Count ?? 0;
        int completedBookings = bookingGroup.FirstOrDefault(g => g.Status == BookingStatus.Completed)?.Count ?? 0;
        int cancelledBookings = bookingGroup.FirstOrDefault(g => g.Status == BookingStatus.Cancelled)?.Count ?? 0;

        // Accurate active holding bookings (within 15 minutes window)
        int holdingBookings = await _context.Bookings
            .AsNoTracking()
            .CountAsync(b => b.Status == BookingStatus.Holding && b.CreatedAt >= holdingCutoff, cancellationToken);

        var bookingsStats = new BookingStatsDto(
            TotalBookings: totalBookings,
            HoldingBookings: holdingBookings,
            PendingBookings: pendingBookings,
            ConfirmedBookings: confirmedBookings,
            CompletedBookings: completedBookings,
            CancelledBookings: cancelledBookings
        );

        // 4. Financial & GMV Metrics (Held = In Escrow, Released = Completed & Paid to Tutor, Refunded = Returned to Student)
        var transactionGroup = await _context.Transactions
            .AsNoTracking()
            .GroupBy(t => t.Status)
            .Select(g => new
            {
                Status = g.Key,
                TotalAmount = g.Sum(t => t.Amount),
                TotalPlatformFee = g.Sum(t => t.CommissionAmount),
                TotalPayoutAmount = g.Sum(t => t.PayoutAmount)
            })
            .ToListAsync(cancellationToken);

        var heldTx = transactionGroup.FirstOrDefault(g => g.Status == TransactionStatus.Held);
        var releasedTx = transactionGroup.FirstOrDefault(g => g.Status == TransactionStatus.Released);
        var refundedTx = transactionGroup.FirstOrDefault(g => g.Status == TransactionStatus.Refunded);

        decimal heldAmount = heldTx?.TotalAmount ?? 0;
        decimal releasedAmount = releasedTx?.TotalAmount ?? 0;
        decimal refundedAmount = refundedTx?.TotalAmount ?? 0;

        decimal totalGmv = heldAmount + releasedAmount + refundedAmount;
        decimal netGmv = heldAmount + releasedAmount;
        decimal totalPlatformRevenue = releasedTx?.TotalPlatformFee ?? 0;
        decimal totalTutorPayouts = releasedTx?.TotalPayoutAmount ?? 0;
        decimal totalRefundedAmount = refundedAmount;

        var financialsStats = new FinancialStatsDto(
            TotalGmv: totalGmv,
            NetGmv: netGmv,
            TotalPlatformRevenue: totalPlatformRevenue,
            TotalTutorPayouts: totalTutorPayouts,
            TotalRefundedAmount: totalRefundedAmount
        );

        // 5. Action Queue Metrics
        int pendingWithdrawalsCount = await _context.Withdrawals
            .AsNoTracking()
            .CountAsync(w => w.Status == WithdrawalStatus.Pending, cancellationToken);

        int openReportsCount = await _context.Reports
            .AsNoTracking()
            .CountAsync(r => r.Status == ReportStatus.Open, cancellationToken);

        var actionQueue = new ActionQueueDto(
            PendingTutorsCount: pendingReviewTutors,
            PendingWithdrawalsCount: pendingWithdrawalsCount,
            OpenReportsCount: openReportsCount
        );

        return new AdminDashboardStatsDto(
            Users: usersStats,
            Tutors: tutorsStats,
            Bookings: bookingsStats,
            Financials: financialsStats,
            ActionQueue: actionQueue
        );
    }
}
