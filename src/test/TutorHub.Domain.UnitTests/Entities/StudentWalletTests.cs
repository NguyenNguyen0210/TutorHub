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
        ReservedBalance = reserved,
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
    public void ReserveForWithdrawal_WhenSufficient_MovesFundsToReservedBalance()
    {
        var wallet = CreateWallet(available: 500_000m, reserved: 0m);
        var now = DateTime.UtcNow;

        wallet.ReserveForWithdrawal(200_000m, now);

        wallet.AvailableBalance.Should().Be(300_000m);
        wallet.ReservedBalance.Should().Be(200_000m);
        wallet.TotalBalance.Should().Be(500_000m);
        wallet.UpdatedAt.Should().Be(now);
    }

    [Fact]
    public void ReserveForWithdrawal_WhenInsufficient_ThrowsInvalidOperationException()
    {
        var wallet = CreateWallet(available: 100_000m, reserved: 0m);

        var act = () => wallet.ReserveForWithdrawal(150_000m, DateTime.UtcNow);

        act.Should().Throw<InvalidOperationException>();
        wallet.AvailableBalance.Should().Be(100_000m);
        wallet.ReservedBalance.Should().Be(0m);
    }

    [Fact]
    public void FinalizeWithdrawal_WhenReservedSufficient_DecrementsReservedBalance()
    {
        var wallet = CreateWallet(available: 300_000m, reserved: 200_000m);
        var now = DateTime.UtcNow;

        wallet.FinalizeWithdrawal(200_000m, now);

        wallet.AvailableBalance.Should().Be(300_000m);
        wallet.ReservedBalance.Should().Be(0m);
        wallet.TotalBalance.Should().Be(300_000m);
        wallet.UpdatedAt.Should().Be(now);
    }

    [Fact]
    public void FinalizeWithdrawal_WhenExceedsReserved_ThrowsInvalidOperationException()
    {
        var wallet = CreateWallet(available: 300_000m, reserved: 100_000m);

        var act = () => wallet.FinalizeWithdrawal(150_000m, DateTime.UtcNow);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Reserved balance is insufficient*");
        wallet.ReservedBalance.Should().Be(100_000m);
    }

    [Fact]
    public void ReleaseWithdrawalReservation_WhenReservedSufficient_ReturnsFundsToAvailable()
    {
        var wallet = CreateWallet(available: 300_000m, reserved: 200_000m);
        var now = DateTime.UtcNow;

        wallet.ReleaseWithdrawalReservation(200_000m, now);

        wallet.AvailableBalance.Should().Be(500_000m);
        wallet.ReservedBalance.Should().Be(0m);
        wallet.TotalBalance.Should().Be(500_000m);
        wallet.UpdatedAt.Should().Be(now);
    }

    [Fact]
    public void ReleaseWithdrawalReservation_WhenExceedsReserved_ThrowsInvalidOperationException()
    {
        var wallet = CreateWallet(available: 300_000m, reserved: 50_000m);

        var act = () => wallet.ReleaseWithdrawalReservation(100_000m, DateTime.UtcNow);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Cannot release more than currently reserved balance*");
        wallet.ReservedBalance.Should().Be(50_000m);
        wallet.AvailableBalance.Should().Be(300_000m);
    }
}
