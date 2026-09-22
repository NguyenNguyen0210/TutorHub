using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Dashboard.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Dashboard.GetAdminDashboardStats;

public class GetAdminDashboardStatsQueryHandler : IRequestHandler<GetAdminDashboardStatsQuery, AdminDashboardStatsDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;

    public GetAdminDashboardStatsQueryHandler(IAppDbContext context, IClock clock)
    {
        _context = context;
        _clock = clock;
    }

    public async Task<AdminDashboardStatsDto> Handle(GetAdminDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        // 1. Grouped Users Metrics
        var userGroup = await _context.Users
            .AsNoTracking()
            .GroupBy(u => new { u.Role, u.Status })
            .Select(g => new { g.Key.Role, g.Key.Status, Count = g.Count() })
            .ToListAsync(cancellationToken);

        int totalUsers = userGroup.Sum(g => g.Count);
        int totalStudents = userGroup.Where(g => g.Role == UserRole.Student).Sum(g => g.Count);
        int totalTutors = userGroup.Where(g => g.Role == UserRole.Tutor).Sum(g => g.Count);
        int activeUsers = userGroup.Where(g => g.Status == AccountStatus.Active).Sum(g => g.Count);

        var usersStats = new UserStatsDto(
            TotalUsers: totalUsers,
            TotalStudents: totalStudents,
            TotalTutors: totalTutors,
            ActiveUsers: activeUsers
        );

        // 2. Grouped Tutors Metrics (based on TutorApplications & User status)
        var applicationGroup = await _context.TutorApplications
            .AsNoTracking()
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        int verifiedTutors = applicationGroup.FirstOrDefault(g => g.Status == TutorApplicationStatus.Approved)?.Count ?? 0;
        int pendingReviewTutors = applicationGroup.FirstOrDefault(g => g.Status == TutorApplicationStatus.Pending)?.Count ?? 0;
        int draftTutors = 0;
        int rejectedTutors = applicationGroup.FirstOrDefault(g => g.Status == TutorApplicationStatus.Rejected)?.Count ?? 0;
        int suspendedTutors = userGroup.Where(g => g.Role == UserRole.Tutor && g.Status == AccountStatus.Suspended).Sum(g => g.Count);

        var tutorsStats = new TutorStatsDto(
            VerifiedTutors: verifiedTutors,
            PendingReviewTutors: pendingReviewTutors,
            DraftTutors: draftTutors,
            RejectedTutors: rejectedTutors,
            SuspendedTutors: suspendedTutors
        );

        // 3. Grouped Bookings Metrics
        var nowUtc = _clock.UtcNow;
        var holdingCutoff = nowUtc.AddMinutes(-15);

        var bookingGroup = await _context.Bookings
            .AsNoTracking()
            .GroupBy(b => b.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        int totalBookings = bookingGroup.Sum(g => g.Count);
        // Wave 3: Holding / Paid / Cancelled / Expired are the only states.
        int paidBookings = bookingGroup.FirstOrDefault(g => g.Status == BookingStatus.Paid)?.Count ?? 0;
        int cancelledBookings = bookingGroup.FirstOrDefault(g => g.Status == BookingStatus.Cancelled)?.Count ?? 0;
        int expiredBookings = bookingGroup.FirstOrDefault(g => g.Status == BookingStatus.Expired)?.Count ?? 0;

        // Accurate active holding bookings (within 15 minutes window)
        int holdingBookings = await _context.Bookings
            .AsNoTracking()
            .CountAsync(b => b.Status == BookingStatus.Holding && b.CreatedAt >= holdingCutoff, cancellationToken);

        var bookingsStats = new BookingStatsDto(
            TotalBookings: totalBookings,
            HoldingBookings: holdingBookings,
            PaidBookings: paidBookings,
            CancelledBookings: cancelledBookings,
            ExpiredBookings: expiredBookings
        );

        // 4. Financial & GMV Metrics
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

        var releasedTx = transactionGroup.FirstOrDefault(g => g.Status == TransactionStatus.Released);

        // GMV is computed from real paid bookings to prevent double-counting
        // with per-session payout releases (P1-1).
        decimal totalGmv = await _context.Bookings
            .AsNoTracking()
            .Where(b => b.Status == BookingStatus.Paid)
            .SumAsync(b => (decimal?)b.TotalPrice, cancellationToken) ?? 0;

        // Refunds are materialized as StudentRefund transactions and start Pending
        // until the external provider settles them (DEC-S8-032); count by type so
        // the obligation is visible regardless of settlement status.
        decimal refundedAmount = await _context.Transactions
            .AsNoTracking()
            .Where(t => t.Type == TransactionType.StudentRefund)
            .SumAsync(t => (decimal?)t.Amount, cancellationToken) ?? 0;

        decimal netGmv = Math.Max(0m, totalGmv - refundedAmount);

        // Platform fee reversals from settled disputes reduce recognized platform revenue (P1-2).
        decimal feeReversals = await _context.Transactions
            .AsNoTracking()
            .Where(t => t.Type == TransactionType.PlatformFeeReversal)
            .SumAsync(t => (decimal?)t.CommissionAmount, cancellationToken) ?? 0;

        decimal totalPlatformRevenue = Math.Max(0m, (releasedTx?.TotalPlatformFee ?? 0) - feeReversals);
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
