using FluentAssertions;
using TutorHub.Domain.Entities;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class StudentWalletTests
{
    private static StudentWallet CreateWallet(decimal available = 0m, decimal reserved = 0m) => new()
    {
        Id = Guid.NewGuid(),
        StudentProfileId = Guid.NewGuid(),
        AvailableBalance = available,
        WithdrawingBalance = reserved,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    [Fact]
    public void Credit_WhenPositive_IncrementsAvailableBalance()
    {
        var wallet = CreateWallet(available: 100_000m);
        var now = DateTime.UtcNow;

        wallet.Credit(50_000m, now);

        wallet.AvailableBalance.Should().Be(150_000m);
        wallet.TotalBalance.Should().Be(150_000m);
        wallet.UpdatedAt.Should().Be(now);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-10_000)]
    public void Credit_WhenNonPositive_ThrowsArgumentException(decimal amount)
    {
        var wallet = CreateWallet(available: 100_000m);

        var act = () => wallet.Credit(amount, DateTime.UtcNow);

        act.Should().Throw<ArgumentException>();
        wallet.AvailableBalance.Should().Be(100_000m);
    }

    [Fact]
    public void Debit_WhenSufficient_DecrementsAvailableBalance()
    {
        var wallet = CreateWallet(available: 200_000m);
        var now = DateTime.UtcNow;

        wallet.Debit(80_000m, now);

        wallet.AvailableBalance.Should().Be(120_000m);
        wallet.TotalBalance.Should().Be(120_000m);
        wallet.UpdatedAt.Should().Be(now);
    }

    [Fact]
    public void Debit_WhenInsufficient_ThrowsInvalidOperationException_AndPreservesBalance()
    {
        var wallet = CreateWallet(available: 50_000m);

        var act = () => wallet.Debit(80_000m, DateTime.UtcNow);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Insufficient wallet balance*");
        wallet.AvailableBalance.Should().Be(50_000m);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-50_000)]
    public void Debit_WhenNonPositive_ThrowsArgumentException(decimal amount)
    {
        var wallet = CreateWallet(available: 100_000m);

        var act = () => wallet.Debit(amount, DateTime.UtcNow);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void HoldForWithdrawal_WhenSufficient_MovesFundsToWithdrawingBalance()
    {
        var wallet = CreateWallet(available: 500_000m, reserved: 0m);
        var now = DateTime.UtcNow;

        wallet.HoldForWithdrawal(200_000m, now);

        wallet.AvailableBalance.Should().Be(300_000m);
        wallet.WithdrawingBalance.Should().Be(200_000m);
        wallet.TotalBalance.Should().Be(500_000m);
        wallet.UpdatedAt.Should().Be(now);
    }

    [Fact]
    public void HoldForWithdrawal_WhenInsufficient_ThrowsInvalidOperationException()
    {
        var wallet = CreateWallet(available: 100_000m, reserved: 0m);

        var act = () => wallet.HoldForWithdrawal(150_000m, DateTime.UtcNow);

        act.Should().Throw<InvalidOperationException>();
        wallet.AvailableBalance.Should().Be(100_000m);
        wallet.WithdrawingBalance.Should().Be(0m);
    }

    [Fact]
    public void CompleteWithdrawal_WhenWithdrawingSufficient_DecrementsWithdrawingBalance()
    {
        var wallet = CreateWallet(available: 300_000m, reserved: 200_000m);
        var now = DateTime.UtcNow;

        wallet.CompleteWithdrawal(200_000m, now);

        wallet.AvailableBalance.Should().Be(300_000m);
        wallet.WithdrawingBalance.Should().Be(0m);
        wallet.TotalBalance.Should().Be(300_000m);
        wallet.UpdatedAt.Should().Be(now);
    }

    [Fact]
    public void CompleteWithdrawal_WhenExceedsWithdrawing_ThrowsInvalidOperationException()
    {
        var wallet = CreateWallet(available: 300_000m, reserved: 100_000m);

        var act = () => wallet.CompleteWithdrawal(150_000m, DateTime.UtcNow);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Withdrawing balance is insufficient*");
        wallet.WithdrawingBalance.Should().Be(100_000m);
    }

    [Fact]
    public void ReleaseWithdrawal_WhenWithdrawingSufficient_ReturnsFundsToAvailable()
    {
        var wallet = CreateWallet(available: 300_000m, reserved: 200_000m);
        var now = DateTime.UtcNow;

        wallet.ReleaseWithdrawal(200_000m, now);

        wallet.AvailableBalance.Should().Be(500_000m);
        wallet.WithdrawingBalance.Should().Be(0m);
        wallet.TotalBalance.Should().Be(500_000m);
        wallet.UpdatedAt.Should().Be(now);
    }

    [Fact]
    public void ReleaseWithdrawal_WhenExceedsWithdrawing_ThrowsInvalidOperationException()
    {
        var wallet = CreateWallet(available: 300_000m, reserved: 50_000m);

        var act = () => wallet.ReleaseWithdrawal(100_000m, DateTime.UtcNow);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Cannot release more than currently withdrawing balance*");
        wallet.WithdrawingBalance.Should().Be(50_000m);
        wallet.AvailableBalance.Should().Be(300_000m);
    }
}
