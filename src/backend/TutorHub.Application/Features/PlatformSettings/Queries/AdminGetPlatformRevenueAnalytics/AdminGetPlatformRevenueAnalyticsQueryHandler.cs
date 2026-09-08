using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.PlatformSettings.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.PlatformSettings.Queries.AdminGetPlatformRevenueAnalytics;

public class AdminGetPlatformRevenueAnalyticsQueryHandler : IRequestHandler<AdminGetPlatformRevenueAnalyticsQuery, PlatformRevenueAnalyticsDto>
{
    private readonly IAppDbContext _context;

    public AdminGetPlatformRevenueAnalyticsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PlatformRevenueAnalyticsDto> Handle(AdminGetPlatformRevenueAnalyticsQuery request, CancellationToken cancellationToken)
    {
        // 1. Gross booking volume (all completed / succeeded booking payments)
        var grossBookingVolume = await _context.Transactions
            .AsNoTracking()
            .Where(t => t.Type == TransactionType.BookingPayment &&
                        (t.Status == TransactionStatus.Succeeded || t.Status == TransactionStatus.Released))
            .SumAsync(t => t.Amount, cancellationToken);

        // 2. Gross released earnings
        var grossReleasedEarnings = await _context.Transactions
            .AsNoTracking()
            .Where(t => t.Type == TransactionType.SessionPayoutCredit && t.Status == TransactionStatus.Released)
            .SumAsync(t => t.Amount, cancellationToken);

        // 3. Recognized platform fee
        var recognizedFee = await _context.Transactions
            .AsNoTracking()
            .Where(t => t.Type == TransactionType.SessionPayoutCredit && t.Status == TransactionStatus.Released)
            .SumAsync(t => t.CommissionAmount, cancellationToken);

        // 4. Platform fee reversals (from dispute adjustments)
        var feeReversals = await _context.Transactions
            .AsNoTracking()
            .Where(t => t.Type == TransactionType.PlatformFeeReversal && t.Status == TransactionStatus.Succeeded)
            .SumAsync(t => t.CommissionAmount, cancellationToken);

        // 5. Net recognized platform revenue
        var netRevenue = recognizedFee - feeReversals;

        // 6. Unrecognized pending platform fee (pending escrow sessions)
        var pendingSessions = await _context.Sessions
            .AsNoTracking()
            .Include(s => s.Enrollment)
            .Where(s => !s.IsPayoutReleased && s.Status != SessionStatus.Cancelled)
            .ToListAsync(cancellationToken);

        var unrecognizedPendingFee = pendingSessions.Sum(s =>
            Math.Round(s.EarningAmount * (s.Enrollment?.PlatformFeeRate ?? 0.10m), MidpointRounding.AwayFromZero));

        // 7. Dispute Metrics
        var disputes = await _context.Disputes
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var totalDisputes = disputes.Count;
        var openDisputes = disputes.Count(d => d.Status == DisputeStatus.Open || d.Status == DisputeStatus.RequiresAdminFinancialIntervention);
        var underReviewDisputes = disputes.Count(d => d.Status == DisputeStatus.UnderReview);
        var resolvedDisputes = disputes.Count(d => d.Status == DisputeStatus.Resolved);
        var dismissedDisputes = disputes.Count(d => d.Status == DisputeStatus.Dismissed);

        var totalRefunded = await _context.Transactions
            .AsNoTracking()
            .Where(t => t.Type == TransactionType.StudentRefund)
            .SumAsync(t => t.Amount, cancellationToken);

        var totalRecovered = Math.Max(0m, totalRefunded - feeReversals);

        return new PlatformRevenueAnalyticsDto
        {
            GrossBookingVolume = grossBookingVolume,
            GrossReleasedEarnings = grossReleasedEarnings,
            RecognizedPlatformFee = recognizedFee,
            PlatformFeeReversals = feeReversals,
            NetRecognizedPlatformRevenue = netRevenue,
            UnrecognizedPendingPlatformFee = unrecognizedPendingFee,
            DisputeMetrics = new PlatformDisputeMetricsDto
            {
                TotalDisputes = totalDisputes,
                OpenDisputes = openDisputes,
                UnderReviewDisputes = underReviewDisputes,
                ResolvedDisputes = resolvedDisputes,
                DismissedDisputes = dismissedDisputes,
                TotalRefundedToStudents = totalRefunded,
                TotalRecoveredFromTutors = totalRecovered,
                TotalFeeReversed = feeReversals
            }
        };
    }
}
