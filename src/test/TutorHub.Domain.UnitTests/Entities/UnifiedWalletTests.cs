using FluentAssertions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class UnifiedWalletTests
{
    private static Wallet CreateWallet(decimal available = 0m, decimal pending = 0m, decimal withdrawing = 0m) => new()
    {
        Id = Guid.NewGuid(),
        UserId = Guid.NewGuid(),
        AvailableBalance = available,
        PendingBalance = pending,
        WithdrawingBalance = withdrawing,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    [Fact]
    public void TotalBalance_ReflectsSumOfAllThreeBuckets()
    {
        var wallet = CreateWallet(available: 100_000m, pending: 200_000m, withdrawing: 50_000m);
        wallet.TotalBalance.Should().Be(350_000m);
        wallet.WithdrawableBalance.Should().Be(100_000m);
    }

    [Fact]
    public void CreditAvailable_IncrementsAvailableBalance()
    {
        var wallet = CreateWallet(available: 50_000m);
        var now = DateTime.UtcNow;

        wallet.CreditAvailable(100_000m, now);

        wallet.AvailableBalance.Should().Be(150_000m);
        wallet.UpdatedAt.Should().Be(now);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-500)]
    public void CreditAvailable_WhenNonPositive_ThrowsArgumentException(decimal amount)
    {
        var wallet = CreateWallet(available: 50_000m);
        var act = () => wallet.CreditAvailable(amount, DateTime.UtcNow);
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void DebitAvailable_DecrementsAvailableBalance()
    {
        var wallet = CreateWallet(available: 150_000m);
        var now = DateTime.UtcNow;

        wallet.DebitAvailable(50_000m, now);

        wallet.AvailableBalance.Should().Be(100_000m);
        wallet.UpdatedAt.Should().Be(now);
    }

    [Fact]
    public void DebitAvailable_WhenInsufficient_ThrowsInvalidOperationException()
    {
        var wallet = CreateWallet(available: 30_000m);
        var act = () => wallet.DebitAvailable(50_000m, DateTime.UtcNow);
        act.Should().Throw<InvalidOperationException>().WithMessage("*Insufficient wallet balance*");
    }

    [Fact]
    public void CreditPending_IncrementsPendingBalance()
    {
        var wallet = CreateWallet(pending: 200_000m);
        var now = DateTime.UtcNow;

        wallet.CreditPending(100_000m, now);

        wallet.PendingBalance.Should().Be(300_000m);
        wallet.UpdatedAt.Should().Be(now);
    }

    [Fact]
    public void DebitPending_DecrementsPendingBalance()
    {
        var wallet = CreateWallet(pending: 300_000m);
        var now = DateTime.UtcNow;

        wallet.DebitPending(100_000m, now);

        wallet.PendingBalance.Should().Be(200_000m);
        wallet.UpdatedAt.Should().Be(now);
    }

    [Fact]
    public void DebitPending_WhenInsufficient_ThrowsInvalidOperationException()
    {
        var wallet = CreateWallet(pending: 50_000m);
        var act = () => wallet.DebitPending(100_000m, DateTime.UtcNow);
        act.Should().Throw<InvalidOperationException>().WithMessage("*Pending escrow balance is insufficient*");
    }

    [Fact]
    public void TransferPendingToAvailable_DebitsGrossFromPendingAndCreditsNetToAvailable()
    {
        var wallet = CreateWallet(available: 0m, pending: 500_000m);
        var now = DateTime.UtcNow;

        wallet.TransferPendingToAvailable(gross: 500_000m, net: 450_000m, now);

        wallet.PendingBalance.Should().Be(0m);
        wallet.AvailableBalance.Should().Be(450_000m);
        wallet.UpdatedAt.Should().Be(now);
    }

    [Fact]
    public void HoldForWithdrawal_MovesFundsFromAvailableToWithdrawing()
    {
        var wallet = CreateWallet(available: 200_000m, withdrawing: 0m);
        var now = DateTime.UtcNow;

        wallet.HoldForWithdrawal(100_000m, now);

        wallet.AvailableBalance.Should().Be(100_000m);
        wallet.WithdrawingBalance.Should().Be(100_000m);
        wallet.TotalBalance.Should().Be(200_000m);
        wallet.UpdatedAt.Should().Be(now);
    }

    [Fact]
    public void CompleteWithdrawal_ClearsWithdrawingBalance()
    {
        var wallet = CreateWallet(available: 50_000m, withdrawing: 100_000m);
        var now = DateTime.UtcNow;

        wallet.CompleteWithdrawal(100_000m, now);

        wallet.WithdrawingBalance.Should().Be(0m);
        wallet.AvailableBalance.Should().Be(50_000m);
        wallet.UpdatedAt.Should().Be(now);
    }

    [Fact]
    public void CompleteWithdrawal_WhenInsufficient_ThrowsInvalidOperationException()
    {
        var wallet = CreateWallet(available: 50_000m, withdrawing: 50_000m);
        var act = () => wallet.CompleteWithdrawal(100_000m, DateTime.UtcNow);
        act.Should().Throw<InvalidOperationException>().WithMessage("*Withdrawing balance is insufficient*");
    }

    [Fact]
    public void ReleaseWithdrawal_RestoresWithdrawingFundsBackToAvailable()
    {
        var wallet = CreateWallet(available: 50_000m, withdrawing: 100_000m);
        var now = DateTime.UtcNow;

        wallet.ReleaseWithdrawal(100_000m, now);

        wallet.WithdrawingBalance.Should().Be(0m);
        wallet.AvailableBalance.Should().Be(150_000m);
        wallet.UpdatedAt.Should().Be(now);
    }
}

