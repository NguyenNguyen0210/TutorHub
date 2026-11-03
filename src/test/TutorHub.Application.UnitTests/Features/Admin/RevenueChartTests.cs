using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Dashboard.GetAdminRevenueChart;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.UnitTests.Features.Admin;

public class RevenueChartTests
{
    [Fact]
    public async Task ChartUsesPaidLedgerTypes_VietnamMonthBoundary_AndPreservesNegativeRevenue()
    {
        var now = new DateTime(2026, 11, 3, 12, 0, 0, DateTimeKind.Utc);
        Transaction Row(TransactionType type, TransactionStatus status, decimal amount, decimal fee = 0, decimal payout = 0) =>
            new() { Id = Guid.NewGuid(), Type = type, Status = status, Amount = amount, PlatformFeeAmount = fee, PayoutAmount = payout, CreatedAt = now };
        var transactions = new List<Transaction> {
            Row(TransactionType.BookingPayment, TransactionStatus.Held, 1_000_000m),
            Row(TransactionType.BookingPayment, TransactionStatus.Succeeded, 2_000_000m),
            Row(TransactionType.BookingPayment, TransactionStatus.Failed, 8_000_000m),
            Row(TransactionType.SessionPayoutCredit, TransactionStatus.Released, 1_000_000m, 100_000m, 900_000m),
            Row(TransactionType.PlatformFeeReversal, TransactionStatus.Succeeded, 0, 200_000m),
            Row(TransactionType.PlatformFeeReversal, TransactionStatus.Pending, 0, 900_000m),
            Row(TransactionType.StudentRefund, TransactionStatus.Succeeded, 100_000m),
            Row(TransactionType.StudentRefund, TransactionStatus.Pending, 300_000m)
        };
        // November in Vietnam starts at 17:00 UTC on October 31.
        transactions[0].CreatedAt = new DateTime(2026, 10, 31, 17, 0, 0, DateTimeKind.Utc);
        var previousMonth = Row(TransactionType.BookingPayment, TransactionStatus.Held, 9_000_000m);
        previousMonth.CreatedAt = new DateTime(2026, 10, 31, 16, 59, 59, DateTimeKind.Utc);
        transactions.Add(previousMonth);
        var legacyPayout = Row(TransactionType.SessionPayoutCredit, TransactionStatus.Succeeded, 200_000m, 20_000m, 180_000m);
        legacyPayout.ReleasedAt = now;
        transactions.Add(legacyPayout);
        // A generic success without evidence of release must not become tutor income.
        transactions.Add(Row(TransactionType.SessionPayoutCredit, TransactionStatus.Succeeded, 500_000m, 50_000m, 450_000m));
        var context = new Mock<IAppDbContext>();
        context.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(transactions).Object);
        context.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(new List<Booking>()).Object);
        var handler = new GetAdminRevenueChartQueryHandler(context.Object, new StubClock(now));
        var result = await handler.Handle(new GetAdminRevenueChartQuery(1), CancellationToken.None);
        var point = result.Data.Should().ContainSingle().Subject;
        point.Month.Should().Be("2026-11");
        point.TotalGmv.Should().Be(3_000_000m);
        point.NetGmv.Should().Be(2_900_000m);
        point.PlatformRevenue.Should().Be(-80_000m);
        point.TutorPayouts.Should().Be(1_080_000m);
    }
}
