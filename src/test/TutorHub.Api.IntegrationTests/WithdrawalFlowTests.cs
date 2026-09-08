using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Features.Admin.Withdrawals.CompleteWithdrawal;
using TutorHub.Application.Features.Admin.Withdrawals.ProcessWithdrawal;
using TutorHub.Application.Features.Wallets.CreateWithdrawal;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// F-30: withdrawal lifecycle on real Postgres — withdrawable enforcement,
/// row-level locking path, and F-24 outbox-only delivery (exactly one
/// WithdrawalRequestedEvent outbox row per withdrawal).
/// </summary>
public class WithdrawalFlowTests : IntegrationTestBase
{
    public WithdrawalFlowTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task CreateWithdrawal_DeductsWithdrawable_AndEnqueuesSingleOutboxEvent()
    {
        // Arrange
        var (tutorUser, tutor, _) = await SeedHelper.SeedTutorWithWalletAsync(Db);

        // Act
        var result = await SendAsync(new CreateWithdrawalCommand(
            UserId: tutorUser.Id,
            Amount: 300_000m,
            BankName: "Vietcombank",
            BankCode: "VCB",
            AccountNumber: "1234567890",
            AccountHolderName: "INTEGRATION TUTOR"));

        // Assert
        result.Status.Should().Be(WithdrawalStatus.Pending);

        var wallet = await Db.Wallets.AsNoTracking().FirstAsync(w => w.Id == result.WalletId);
        wallet.AvailableBalance.Should().Be(700_000m);

        var ledger = await Db.WalletTransactions
            .AsNoTracking()
            .Where(t => t.WithdrawalId == result.Id)
            .ToListAsync();
        ledger.Should().ContainSingle()
            .Which.Type.Should().Be(WalletTransactionType.WithdrawalDebit);

        // F-24: exactly one outbox event — no duplicate direct publish.
        var outboxCount = await Db.OutboxMessages
            .AsNoTracking()
            .CountAsync(m => m.AggregateId == result.Id);
        outboxCount.Should().Be(1);
    }

    [Fact]
    public async Task CreateWithdrawal_WhenAmountExceedsWithdrawable_Throws()
    {
        // Arrange: 500k available but 400k held → 100k withdrawable.
        var (tutorUser, _, _) = await SeedHelper.SeedTutorWithWalletAsync(
            Db, availableBalance: 500_000m, heldBalance: 400_000m);

        // Act
        var act = () => SendAsync(new CreateWithdrawalCommand(
            UserId: tutorUser.Id,
            Amount: 300_000m,
            BankName: "Vietcombank",
            AccountNumber: "1234567890",
            AccountHolderName: "INTEGRATION TUTOR"));

        // Assert
        await act.Should().ThrowAsync<BadRequestException>();
    }

    [Fact]
    public async Task FullLifecycle_Pending_To_Processing_To_Completed()
    {
        // Arrange
        var (tutorUser, _, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var created = await SendAsync(new CreateWithdrawalCommand(
            UserId: tutorUser.Id,
            Amount: 200_000m,
            BankName: "Vietcombank",
            AccountNumber: "1234567890",
            AccountHolderName: "INTEGRATION TUTOR"));

        // Act
        var processing = await SendAsync(new ProcessWithdrawalCommand(created.Id, admin.Id));
        var completed = await SendAsync(new CompleteWithdrawalCommand(created.Id, admin.Id));

        // Assert
        processing.Status.Should().Be(WithdrawalStatus.Processing);
        completed.Status.Should().Be(WithdrawalStatus.Completed);
    }
}
