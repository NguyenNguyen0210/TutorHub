using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Dashboard.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Dashboard.GetAdminRevenueChart;

public class GetAdminRevenueChartQueryHandler : IRequestHandler<GetAdminRevenueChartQuery, RevenueChartDto>
{
    private readonly IAppDbContext _context;

    public GetAdminRevenueChartQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<RevenueChartDto> Handle(GetAdminRevenueChartQuery request, CancellationToken cancellationToken)
    {
        // 1. Calculate Vietnam Timezone Reporting Boundary (UTC+7)
        var nowUtc = DateTime.UtcNow;
        var nowVn = nowUtc.AddHours(7);
        var currentMonthStartVn = new DateTime(nowVn.Year, nowVn.Month, 1, 0, 0, 0, DateTimeKind.Unspecified);

        // Start from (Months - 1) months prior up to the current month inclusive
        var startMonthVn = currentMonthStartVn.AddMonths(-(request.Months - 1));
        var nextMonthStartVn = currentMonthStartVn.AddMonths(1);

        // Convert VN boundaries to UTC for querying PostgreSQL
        var startUtc = DateTime.SpecifyKind(startMonthVn.AddHours(-7), DateTimeKind.Utc);
        var endUtc = DateTime.SpecifyKind(nextMonthStartVn.AddHours(-7), DateTimeKind.Utc);

        // Generate full ordered sequence of months (ISO YYYY-MM)
        var monthsList = new List<string>();
        for (var m = startMonthVn; m < nextMonthStartVn; m = m.AddMonths(1))
        {
            monthsList.Add(m.ToString("yyyy-MM"));
        }

        // 2. Query Financial Transactions in range (Held, Released, Refunded)
        var rawTransactions = await _context.Transactions
            .AsNoTracking()
            .Where(t => t.CreatedAt >= startUtc && t.CreatedAt < endUtc)
            .Select(t => new
            {
                t.CreatedAt,
                t.Status,
                t.Amount,
                t.CommissionAmount,
                t.PayoutAmount
            })
            .ToListAsync(cancellationToken);

        // 3. Query Bookings in range
        var rawBookings = await _context.Bookings
            .AsNoTracking()
            .Where(b => b.CreatedAt >= startUtc && b.CreatedAt < endUtc)
            .Select(b => new
            {
                b.CreatedAt,
                b.Status
            })
            .ToListAsync(cancellationToken);

        // 4. Map and aggregate with Zero-Fill guarantee
        var chartData = monthsList.Select(month =>
        {
            // Filter records belonging to this month in Vietnam Time (+7 hours)
            var monthTx = rawTransactions.Where(t => t.CreatedAt.AddHours(7).ToString("yyyy-MM") == month).ToList();
            var monthBk = rawBookings.Where(b => b.CreatedAt.AddHours(7).ToString("yyyy-MM") == month).ToList();

            var heldTx = monthTx.Where(t => t.Status == TransactionStatus.Held).ToList();
            var releasedTx = monthTx.Where(t => t.Status == TransactionStatus.Released).ToList();
            var refundedTx = monthTx.Where(t => t.Status == TransactionStatus.Refunded).ToList();

            decimal heldAmount = heldTx.Sum(t => t.Amount);
            decimal releasedAmount = releasedTx.Sum(t => t.Amount);
            decimal refundedAmount = refundedTx.Sum(t => t.Amount);

            decimal totalGmv = heldAmount + releasedAmount + refundedAmount;
            decimal netGmv = heldAmount + releasedAmount;
            decimal platformRevenue = releasedTx.Sum(t => t.CommissionAmount);
            decimal tutorPayouts = releasedTx.Sum(t => t.PayoutAmount);

            int totalBookings = monthBk.Count;
            int completedBookings = monthBk.Count(b => b.Status == BookingStatus.Completed);

            return new RevenueChartDataPointDto(
                Month: month,
                TotalBookings: totalBookings,
                CompletedBookings: completedBookings,
                TotalGmv: totalGmv,
                NetGmv: netGmv,
                PlatformRevenue: platformRevenue,
                TutorPayouts: tutorPayouts
            );
        }).ToList();

        return new RevenueChartDto(
            Months: request.Months,
            FromMonth: monthsList.First(),
            ToMonth: monthsList.Last(),
            Data: chartData
        );
    }
}
