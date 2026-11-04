using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Dashboard.GetAdminDashboardStats;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.UnitTests.Features.Admin;

public class DashboardStatsTests
{
    [Theory]
    [InlineData(DashboardPeriod.Today, 0)]
    [InlineData(DashboardPeriod.SevenDays, 6)]
    [InlineData(DashboardPeriod.ThirtyDays, 29)]
    public async Task FiltersEventDatesAtVietnamMidnight_AndKeepsCurrentQueues(DashboardPeriod period, int daysBack)
    {
        var now = new DateTime(2026, 11, 4, 2, 0, 0, DateTimeKind.Utc);
        var boundary = new DateTime(2026, 11, 3, 17, 0, 0, DateTimeKind.Utc).AddDays(-daysBack);
        var context = Context();
        context.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(new List<Booking> {
            new() { Status = BookingStatus.Paid, TotalPrice = 1000, CreatedAt = boundary.AddDays(-1), ConfirmedAt = boundary },
            new() { Status = BookingStatus.Paid, TotalPrice = 9000, CreatedAt = boundary.AddSeconds(-1), ConfirmedAt = boundary.AddSeconds(-1) },
            new() { Status = BookingStatus.Holding, CreatedAt = boundary },
            new() { Status = BookingStatus.Paid, TotalPrice = 9000, CreatedAt = now.AddDays(1), ConfirmedAt = now.AddDays(1) }
        }).Object);
        context.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Transaction> {
            new() { Type = TransactionType.SessionPayoutCredit, Status = TransactionStatus.Released, CreatedAt = boundary.AddDays(-1), ReleasedAt = boundary, PayoutAmount = 900, PlatformFeeAmount = 100 },
            new() { Type = TransactionType.SessionPayoutCredit, Status = TransactionStatus.Released, CreatedAt = boundary.AddSeconds(-1), ReleasedAt = boundary.AddSeconds(-1), PayoutAmount = 9000 },
            new() { Type = TransactionType.StudentRefund, Status = TransactionStatus.Succeeded, CreatedAt = boundary.AddDays(-1), RefundedAt = boundary, Amount = 50 },
            new() { Type = TransactionType.StudentRefund, Status = TransactionStatus.Pending, SettlementRequired = true, CreatedAt = boundary, Amount = 70 },
            new() { Type = TransactionType.StudentRefund, Status = TransactionStatus.Failed, SettlementRequired = true, CreatedAt = boundary, Amount = 800 },
            new() { Type = TransactionType.PlatformFeeReversal, Status = TransactionStatus.Succeeded, CreatedAt = boundary, PlatformFeeAmount = 120 },
            new() { Type = TransactionType.PlatformFeeReversal, Status = TransactionStatus.Pending, CreatedAt = boundary, PlatformFeeAmount = 900 }
        }).Object);
        Dispute Case(DisputeStatus status)
        {
            var dispute = new Dispute { CreatedAt = boundary.AddYears(-1) };
            typeof(Dispute).GetProperty(nameof(Dispute.Status))!.SetValue(dispute, status);
            return dispute;
        }
        context.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(new List<Dispute> {
            Case(DisputeStatus.Open),
            Case(DisputeStatus.RequiresAdminRefundSettlement),
            Case(DisputeStatus.Resolved)
        }).Object);
        var studentUser = new User { Role = UserRole.Student };
        var studentWallet = new Wallet { User = studentUser, StudentProfile = new StudentProfile { User = studentUser } };
        context.Setup(c => c.TopUpRequests).Returns(MockDbSetHelper.CreateMockDbSet(new List<TopUpRequest> {
            new() { Wallet = studentWallet, Status = TopUpRequestStatus.Pending, TransferReference = "BANK-1", RequestedAt = boundary.AddYears(-1) },
            new() { Wallet = studentWallet, Status = TopUpRequestStatus.Pending, TransferReference = "topup-1" },
            new() { Wallet = studentWallet, Status = TopUpRequestStatus.Pending, TransferReference = "BANK-2", AdminNote = "VNPay transaction" },
            new() { Wallet = studentWallet, Status = TopUpRequestStatus.Confirmed, TransferReference = "BANK-3" }
        }).Object);
        context.Setup(c => c.Withdrawals).Returns(MockDbSetHelper.CreateMockDbSet(new List<Withdrawal> {
            new() { Wallet = studentWallet, Status = WithdrawalStatus.Pending, RequestedAt = boundary.AddYears(-1) },
            new() { Wallet = studentWallet, Status = WithdrawalStatus.Processing },
            new() { Wallet = new Wallet { User = new User { Role = UserRole.Tutor } }, Status = WithdrawalStatus.Pending }
        }).Object);
        var result = await new GetAdminDashboardStatsQueryHandler(context.Object, new StubClock(now))
            .Handle(new GetAdminDashboardStatsQuery(period), CancellationToken.None);
        result.FromUtc.Should().Be(boundary);
        result.UpdatedAt.Should().Be(now);
        result.Financials.TotalGmv.Should().Be(1000);
        result.Financials.TotalTutorPayouts.Should().Be(900);
        result.Financials.TotalPlatformRevenue.Should().Be(-20);
        result.Financials.TotalRefundedAmount.Should().Be(50);
        result.Financials.PendingRefundAmount.Should().Be(70);
        result.Bookings.TotalBookings.Should().Be(1);
        result.ActionQueue.OpenDisputesCount.Should().Be(2);
        result.ActionQueue.PendingStudentWithdrawalsCount.Should().Be(1);
        result.ActionQueue.PendingWithdrawalsCount.Should().Be(1);
        result.ActionQueue.ReviewableTopUpsCount.Should().Be(1);
        result.ActionQueue.OutstandingRefundsCount.Should().Be(2);
    }

    [Fact]
    public async Task DefaultPeriodIncludesHistory_AndEmptyDataReturnsZero()
    {
        var now = new DateTime(2026, 11, 4, 2, 0, 0, DateTimeKind.Utc);
        var context = Context();
        var handler = new GetAdminDashboardStatsQueryHandler(context.Object, new StubClock(now));
        var result = await handler.Handle(new(), CancellationToken.None);
        result.FromUtc.Should().BeNull();
        result.Period.Should().Be("All");
        result.Financials.TotalGmv.Should().Be(0);
        context.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(new List<Booking> {
            new() { Status = BookingStatus.Paid, CreatedAt = now.AddYears(-2), TotalPrice = 200 }
        }).Object);
        (await handler.Handle(new(), CancellationToken.None)).Financials.TotalGmv.Should().Be(200);
        new GetAdminDashboardStatsQueryValidator().Validate(new GetAdminDashboardStatsQuery((DashboardPeriod)99)).IsValid.Should().BeFalse();
    }

    private static Mock<IAppDbContext> Context()
    {
        var context = new Mock<IAppDbContext>();
        context.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(new List<User>()).Object);
        context.Setup(c => c.TutorApplications).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorApplication>()).Object);
        context.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(new List<Booking>()).Object);
        context.Setup(c => c.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Transaction>()).Object);
        context.Setup(c => c.Withdrawals).Returns(MockDbSetHelper.CreateMockDbSet(new List<Withdrawal>()).Object);
        context.Setup(c => c.TopUpRequests).Returns(MockDbSetHelper.CreateMockDbSet(new List<TopUpRequest>()).Object);
        context.Setup(c => c.Reports).Returns(MockDbSetHelper.CreateMockDbSet(new List<Report>()).Object);
        context.Setup(c => c.Disputes).Returns(MockDbSetHelper.CreateMockDbSet(new List<Dispute>()).Object);
        return context;
    }
}
