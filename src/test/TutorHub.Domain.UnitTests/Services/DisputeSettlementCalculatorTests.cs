using FluentAssertions;
using TutorHub.Domain.Services;
using Xunit;

namespace TutorHub.Domain.UnitTests.Services;

/// <summary>
/// P0-F1 / DEC-S8-025 ("Mandatory Patch B"): post-release dispute settlement must
/// conserve money exactly —
///     StudentRefund ≡ TutorNetRecovery + PlatformFeeReversal
/// — with the fee recomputed at the rate frozen on the original payout transaction.
/// </summary>
public class DisputeSettlementCalculatorTests
{
    private const decimal Gross = 1_000_000m;
    private const decimal Rate = 0.1234m;

    /// <summary>Original payout as recorded by the ledger at the given rate.</summary>
    private static (decimal Gross, decimal Fee, decimal Net) OriginalPayout(decimal gross, decimal rate)
    {
        var (fee, net) = PlatformFeeCalculator.SplitGross(gross, rate);
        return (gross, fee, net);
    }

    [Fact]
    public void CalculatePostRelease_WhenPartialRefund_ConservesMoneyExactly()
    {
        var original = OriginalPayout(Gross, Rate);
        const decimal studentRefund = 250_000m;

        var settlement = DisputeSettlementCalculator.CalculatePostRelease(
            studentRefund, original.Gross, original.Fee, original.Net, Rate);

        settlement.StudentRefund.Should().Be(
            settlement.TutorNetRecovery + settlement.PlatformFeeReversal);

        settlement.TutorFinalGross.Should().Be(750_000m);
        settlement.TutorFinalNet.Should().Be(657_450m);
        settlement.TutorNetRecovery.Should().Be(219_150m);
        settlement.PlatformFeeReversal.Should().Be(30_850m);
    }

    [Fact]
    public void CalculatePostRelease_WhenFullRefund_RecoversWholeNetAndReversesWholeFee()
    {
        var original = OriginalPayout(Gross, Rate);

        var settlement = DisputeSettlementCalculator.CalculatePostRelease(
            Gross, original.Gross, original.Fee, original.Net, Rate);

        settlement.TutorFinalGross.Should().Be(0m);
        settlement.TutorFinalNet.Should().Be(0m);
        settlement.TutorNetRecovery.Should().Be(original.Net);
        settlement.PlatformFeeReversal.Should().Be(original.Fee);
        settlement.StudentRefund.Should().Be(
            settlement.TutorNetRecovery + settlement.PlatformFeeReversal);
    }

    [Fact]
    public void CalculatePostRelease_WhenRateHasFourDecimalPlaces_ConservesMoney()
    {
        // The rate is now stored as numeric(5,4); the identity must still hold once
        // the fee is re-derived from it.
        var original = OriginalPayout(Gross, 0.0555m);

        var settlement = DisputeSettlementCalculator.CalculatePostRelease(
            100_000m, original.Gross, original.Fee, original.Net, 0.0555m);

        settlement.StudentRefund.Should().Be(
            settlement.TutorNetRecovery + settlement.PlatformFeeReversal);
    }

    [Fact]
    public void CalculatePostRelease_WhenRateIsZero_TutorBearsTheWholeRefund()
    {
        var original = OriginalPayout(500_000m, 0m);

        var settlement = DisputeSettlementCalculator.CalculatePostRelease(
            200_000m, original.Gross, original.Fee, original.Net, 0m);

        settlement.PlatformFeeReversal.Should().Be(0m);
        settlement.TutorNetRecovery.Should().Be(200_000m);
    }

    [Fact]
    public void CalculatePostRelease_WhenRefundEqualsGrossPlusOne_Throws()
    {
        var original = OriginalPayout(Gross, Rate);

        Action act = () => DisputeSettlementCalculator.CalculatePostRelease(
            Gross + 1m, original.Gross, original.Fee, original.Net, Rate);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void CalculatePostRelease_WhenRefundIsNegative_Throws()
    {
        var original = OriginalPayout(Gross, Rate);

        Action act = () => DisputeSettlementCalculator.CalculatePostRelease(
            -1m, original.Gross, original.Fee, original.Net, Rate);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }
}
