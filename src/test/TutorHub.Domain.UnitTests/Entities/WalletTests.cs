using FluentAssertions;
using TutorHub.Domain.Entities;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class WalletTests
{
    private static Wallet CreateWallet(decimal pending = 0m, decimal available = 0m, decimal held = 0m) => new()
    {
        Id = Guid.NewGuid(),
        TutorProfileId = Guid.NewGuid(),
        PendingBalance = pending,
        AvailableBalance = available,
        HeldBalance = held,
        UpdatedAt = DateTime.UtcNow
    };

    [Fact]
    public void ReleaseHold_WhenWithinHeld_Decrements()
    {
        var wallet = CreateWallet(available: 500m, held: 200m);
        wallet.ReleaseHold(150m, DateTime.UtcNow);
        wallet.HeldBalance.Should().Be(50m);
    }

    [Fact]
    public void ReleaseHold_WhenExceedsHeld_Throws()
    {
        var wallet = CreateWallet(available: 500m, held: 100m);
        var act = () => wallet.ReleaseHold(150m, DateTime.UtcNow);
        act.Should().Throw<InvalidOperationException>();
        wallet.HeldBalance.Should().Be(100m);
    }

    [Fact]
    public void ReleaseHold_WhenNonPositive_Throws()
    {
        var wallet = CreateWallet(available: 500m, held: 100m);
        var act = () => wallet.ReleaseHold(0m, DateTime.UtcNow);
        act.Should().Throw<ArgumentException>();
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
