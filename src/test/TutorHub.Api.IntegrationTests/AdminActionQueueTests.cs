using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Features.Admin.Dashboard.GetAdminDashboardStats;
using TutorHub.Application.Features.Admin.Transactions.GetAdminTransactions;
using TutorHub.Application.Features.StudentWallets.Queries.AdminGetStudentWithdrawals;
using TutorHub.Application.Features.StudentWallets.Queries.AdminGetTopUpRequests;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;
public class AdminActionQueueTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task QueueCountsMatchActionableLists_ExcludeGatewayTopups_AndIgnoreFinancialDatePeriod()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (user, profile, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        var wallet = new Wallet { Id = Guid.NewGuid(), UserId = user.Id, StudentProfileId = profile.Id, CreatedAt = DateTime.UtcNow };
        Db.Wallets.Add(wallet);
        var old = DateTime.UtcNow.AddDays(-60);
        TopUpRequest Topup(string reference, string? note = null) => new() { Id = Guid.NewGuid(), WalletId = wallet.Id, Amount = 100000, TransferReference = reference + Guid.NewGuid().ToString("N"), AdminNote = note, RequestedAt = old };
        var manual = Topup("BANK-");
        Db.TopUpRequests.AddRange(manual, Topup("topup-"), Topup("BANK-", "Paid through VNPay gateway"));
        Db.Withdrawals.Add(new Withdrawal { Id = Guid.NewGuid(), WalletId = wallet.Id, Amount = 50000, BankName = "Bank", AccountNumber = "123456789", AccountHolderName = "STUDENT", RequestedAt = old });
        var booking = new Booking { Id = Guid.NewGuid(), StudentProfileId = profile.Id, TutorProfileId = tutor.Id, ServiceId = service.Id, SubjectId = service.SubjectId, TotalPrice = service.Price, TotalSessions = 3, SessionDurationMinutes = 60, Status = BookingStatus.Cancelled, CreatedAt = old };
        Db.Bookings.Add(booking);
        var refund = Transaction.CreateRefund(booking.Id, null, null, null, 100000m, $"REF-{Guid.NewGuid():N}", "Outstanding external refund", old);
        refund.SettlementRequired = true; Db.Transactions.Add(refund); await Db.SaveChangesAsync();
        SetCurrentUser(admin.Id, UserRole.Admin);
        var all = await SendAsync(new GetAdminDashboardStatsQuery());
        var today = await SendAsync(new GetAdminDashboardStatsQuery(DashboardPeriod.Today));
        today.ActionQueue.Should().Be(all.ActionQueue);
        var topups = await SendAsync(new AdminGetTopUpRequestsQuery(ReviewableOnly: true, PageSize: 100));
        all.ActionQueue.ReviewableTopUpsCount.Should().Be(topups.TotalCount);
        topups.Items.Should().Contain(t => t.Id == manual.Id);
        topups.Items.Where(t => t.StudentWalletId == wallet.Id).Should().ContainSingle();
        var withdrawals = await SendAsync(new AdminGetStudentWithdrawalsQuery(Status: WithdrawalStatus.Pending));
        all.ActionQueue.PendingStudentWithdrawalsCount.Should().Be(withdrawals.TotalCount);
        var refunds = await SendAsync(new GetAdminTransactionsQuery(Type: TransactionType.StudentRefund, SettlementRequired: true));
        all.ActionQueue.OutstandingRefundsCount.Should().Be(refunds.TotalCount);
        (await Db.Wallets.AsNoTracking().SingleAsync(w => w.Id == wallet.Id)).AvailableBalance.Should().Be(0);
    }
}
