using FluentAssertions;
using TutorHub.Domain.Services;
using Xunit;

namespace TutorHub.Domain.UnitTests.Services;

/// <summary>
/// P0-A2/F1: the gross → (platform fee, tutor net) split is the single rounding
/// authority for every payout path. It must round half away from zero to 2 decimals
/// and never lose or invent money.
/// </summary>
public class PlatformFeeCalculatorTests
{
    [Fact]
    public void SplitGross_RoundsFeeHalfAwayFromZero()
    {
        // 10.10 * 0.05 = 0.505 -> 0.51 away-from-zero (banker's rounding would give 0.50).
        var (fee, net) = PlatformFeeCalculator.SplitGross(10.10m, 0.05m);

        fee.Should().Be(0.51m);
        net.Should().Be(9.59m);
    }

    [Theory]
    [InlineData(1_000_000, 0.1000)]
    [InlineData(1_000_000, 0.1234)]
    [InlineData(333_333, 0.0555)]
    [InlineData(10.10, 0.05)]
    [InlineData(0, 0.10)]
    public void SplitGross_FeePlusNetAlwaysEqualsGross(decimal gross, decimal rate)
    {
        var (fee, net) = PlatformFeeCalculator.SplitGross(gross, rate);

        (fee + net).Should().Be(gross);
    }

    [Fact]
    public void SplitGross_WhenRateIsZero_TutorKeepsEverything()
    {
        var (fee, net) = PlatformFeeCalculator.SplitGross(500_000m, 0m);

        fee.Should().Be(0m);
        net.Should().Be(500_000m);
    }

    [Fact]
    public void SplitGross_WhenGrossIsNegative_Throws()
    {
        Action act = () => PlatformFeeCalculator.SplitGross(-1m, 0.10m);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Theory]
    [InlineData(-0.01)]
    [InlineData(1.00)]
    [InlineData(1.50)]
    public void SplitGross_WhenRateIsOutsideUnitInterval_Throws(decimal rate)
    {
        Action act = () => PlatformFeeCalculator.SplitGross(1_000m, rate);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }
}
