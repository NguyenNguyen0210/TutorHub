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
        var nowUtc = _clock.UtcNow;
        // Vietnam reporting days, with UTC boundaries for PostgreSQL timestamptz.
        DateTime? fromUtc = request.Period == DashboardPeriod.All ? null
            : DateTime.SpecifyKind(nowUtc.AddHours(7).Date.AddHours(-7).AddDays(
                request.Period == DashboardPeriod.SevenDays ? -6 : request.Period == DashboardPeriod.ThirtyDays ? -29 : 0), DateTimeKind.Utc);
        var periodBookings = _context.Bookings.AsNoTracking()
            .Where(b => (!fromUtc.HasValue || b.CreatedAt >= fromUtc.Value) && b.CreatedAt <= nowUtc);
        var periodTransactions = _context.Transactions.AsNoTracking()
            .Where(t => (!fromUtc.HasValue || (t.ReleasedAt ?? t.RefundedAt ?? t.CreatedAt) >= fromUtc.Value)
                && (t.ReleasedAt ?? t.RefundedAt ?? t.CreatedAt) <= nowUtc);
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
        var holdingCutoff = nowUtc.AddMinutes(-15);

        var bookingGroup = await periodBookings
            .GroupBy(b => b.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        int totalBookings = bookingGroup.Sum(g => g.Count);
        // Wave 3: Holding / Paid / Cancelled / Expired are the only states.
        int paidBookings = bookingGroup.FirstOrDefault(g => g.Status == BookingStatus.Paid)?.Count ?? 0;
        int cancelledBookings = bookingGroup.FirstOrDefault(g => g.Status == BookingStatus.Cancelled)?.Count ?? 0;
        int expiredBookings = bookingGroup.FirstOrDefault(g => g.Status == BookingStatus.Expired)?.Count ?? 0;

        // Accurate active holding bookings (within 15 minutes window)
        int holdingBookings = await periodBookings
            .CountAsync(b => b.Status == BookingStatus.Holding && b.CreatedAt >= holdingCutoff, cancellationToken);

        var bookingsStats = new BookingStatsDto(
            TotalBookings: totalBookings,
            HoldingBookings: holdingBookings,
            PaidBookings: paidBookings,
            CancelledBookings: cancelledBookings,
            ExpiredBookings: expiredBookings
        );

        // 4. Financial & GMV Metrics
        var releasedTx = await periodTransactions
            .Where(t => t.Type == TransactionType.SessionPayoutCredit
                && (t.Status == TransactionStatus.Released
                    || (t.Status == TransactionStatus.Succeeded && t.ReleasedAt != null)))
            .GroupBy(t => 1)
            .Select(g => new
            {
                TotalAmount = g.Sum(t => t.Amount),
                TotalPlatformFee = g.Sum(t => t.PlatformFeeAmount),
                TotalPayoutAmount = g.Sum(t => t.PayoutAmount)
            })
            .FirstOrDefaultAsync(cancellationToken);

        // GMV is computed from real paid bookings to prevent double-counting
        // with per-session payout releases (P1-1).
        decimal totalGmv = await _context.Bookings
            .AsNoTracking()
            .Where(b => b.Status == BookingStatus.Paid
                && (!fromUtc.HasValue || (b.ConfirmedAt ?? b.CreatedAt) >= fromUtc.Value)
                && (b.ConfirmedAt ?? b.CreatedAt) <= nowUtc)
            .SumAsync(b => (decimal?)b.TotalPrice, cancellationToken) ?? 0;

        // Settled refunds and outstanding obligations are distinct amounts.
        decimal refundedAmount = await periodTransactions
            .Where(t => t.Type == TransactionType.StudentRefund
                && (t.Status == TransactionStatus.Succeeded || t.Status == TransactionStatus.Refunded))
            .SumAsync(t => (decimal?)t.Amount, cancellationToken) ?? 0;

        decimal pendingRefundAmount = await periodTransactions
            .Where(t => t.Type == TransactionType.StudentRefund && t.Status == TransactionStatus.Pending)
            .SumAsync(t => (decimal?)t.Amount, cancellationToken) ?? 0;

        decimal netGmv = Math.Max(0m, totalGmv - refundedAmount);

        // Platform fee reversals from settled disputes reduce recognized platform revenue (P1-2).
        decimal feeReversals = await periodTransactions
            .Where(t => t.Type == TransactionType.PlatformFeeReversal && t.Status == TransactionStatus.Succeeded)
            .SumAsync(t => (decimal?)t.PlatformFeeAmount, cancellationToken) ?? 0;

        decimal totalPlatformRevenue = (releasedTx?.TotalPlatformFee ?? 0) - feeReversals;
        decimal totalTutorPayouts = releasedTx?.TotalPayoutAmount ?? 0;
        decimal totalRefundedAmount = refundedAmount;

        var financialsStats = new FinancialStatsDto(
            TotalGmv: totalGmv,
            NetGmv: netGmv,
            TotalPlatformRevenue: totalPlatformRevenue,
            TotalTutorPayouts: totalTutorPayouts,
            TotalRefundedAmount: totalRefundedAmount,
            PendingRefundAmount: pendingRefundAmount
        );

        // 5. Action Queue Metrics
        int pendingWithdrawalsCount = await _context.Withdrawals
            .AsNoTracking()
            .CountAsync(w => w.Status == WithdrawalStatus.Pending && w.Wallet.User.Role == UserRole.Tutor, cancellationToken);

        int openReportsCount = await _context.Reports
            .AsNoTracking()
            .CountAsync(r => r.Status == ReportStatus.Open, cancellationToken);

        int openDisputesCount = await _context.Disputes.AsNoTracking().CountAsync(d =>
            d.Status == DisputeStatus.Open || d.Status == DisputeStatus.UnderReview
            || d.Status == DisputeStatus.RequiresAdminFinancialIntervention
            || d.Status == DisputeStatus.RequiresAdminRefundSettlement, cancellationToken);

        int pendingStudentWithdrawalsCount = await _context.Withdrawals.AsNoTracking()
            .CountAsync(w => w.Status == WithdrawalStatus.Pending && w.Wallet.StudentProfile != null && w.Wallet.User.Role == UserRole.Student, cancellationToken);
        int reviewableTopUpsCount = await _context.TopUpRequests.AsNoTracking()
            .CountAsync(r => r.Wallet.StudentProfile != null && r.Wallet.User.Role == UserRole.Student
                && r.Status == TopUpRequestStatus.Pending && !r.TransferReference.ToUpper().StartsWith("TOPUP")
                && (r.AdminNote == null || !r.AdminNote.ToUpper().Contains("VNPAY")), cancellationToken);
        int outstandingRefundsCount = await _context.Transactions.IgnoreQueryFilters().AsNoTracking()
            .CountAsync(t => t.Type == TransactionType.StudentRefund && t.SettlementRequired
                && (t.Status == TransactionStatus.Pending || t.Status == TransactionStatus.Failed), cancellationToken);

        var actionQueue = new ActionQueueDto(
            PendingTutorsCount: pendingReviewTutors,
            PendingWithdrawalsCount: pendingWithdrawalsCount,
            OpenReportsCount: openReportsCount,
            OpenDisputesCount: openDisputesCount,
            PendingStudentWithdrawalsCount: pendingStudentWithdrawalsCount,
            ReviewableTopUpsCount: reviewableTopUpsCount,
            OutstandingRefundsCount: outstandingRefundsCount
        );

        return new AdminDashboardStatsDto(
            Users: usersStats,
            Tutors: tutorsStats,
            Bookings: bookingsStats,
            Financials: financialsStats,
            ActionQueue: actionQueue,
            UpdatedAt: nowUtc,
            FromUtc: fromUtc,
            Period: request.Period.ToString()
        );
    }
}
