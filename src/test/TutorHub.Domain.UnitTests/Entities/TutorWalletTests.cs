using FluentAssertions;
using TutorHub.Domain.Entities;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class TutorWalletTests
{
    private static TutorWallet CreateWallet(decimal pending = 0m, decimal available = 0m) => new()
    {
        Id = Guid.NewGuid(),
        TutorProfileId = Guid.NewGuid(),
        PendingBalance = pending,
        AvailableBalance = available,
        UpdatedAt = DateTime.UtcNow
    };

    [Fact]
    public void DebitAvailableForWithdrawal_WhenSufficient_Decrements()
    {
        var wallet = CreateWallet(available: 500m);
        wallet.DebitAvailableForWithdrawal(200m, DateTime.UtcNow);
        wallet.AvailableBalance.Should().Be(300m);
        wallet.WithdrawableBalance.Should().Be(300m);
    }

    [Fact]
    public void DebitAvailableForWithdrawal_WhenInsufficient_Throws()
    {
        var wallet = CreateWallet(available: 100m);
        var act = () => wallet.DebitAvailableForWithdrawal(150m, DateTime.UtcNow);
        act.Should().Throw<InvalidOperationException>();
        wallet.AvailableBalance.Should().Be(100m);
    }

    [Fact]
    public void DebitAvailable_WhenSufficient_Decrements()
    {
        var wallet = CreateWallet(available: 500m);
        wallet.DebitAvailable(200m, DateTime.UtcNow);
        wallet.AvailableBalance.Should().Be(300m);
    }

    [Fact]
    public void DebitAvailable_WhenInsufficient_Throws()
    {
        var wallet = CreateWallet(available: 100m);
        var act = () => wallet.DebitAvailable(150m, DateTime.UtcNow);
        act.Should().Throw<InvalidOperationException>();
        wallet.AvailableBalance.Should().Be(100m);
    }

    [Fact]
    public void DebitAvailable_WhenNonPositive_Throws()
    {
        var wallet = CreateWallet(available: 100m);
        var act = () => wallet.DebitAvailable(-5m, DateTime.UtcNow);
        act.Should().Throw<ArgumentException>();
    }
}
