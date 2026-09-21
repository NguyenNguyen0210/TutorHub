namespace TutorHub.Domain.Services;

/// <summary>
/// Single authority for splitting a gross session amount into the platform fee and
/// the tutor net (DEC-S8-020 / FR-EARN-003).
///
/// Every payout path used to inline <c>Math.Round(gross * rate, 2, MidpointRounding.AwayFromZero)</c>
/// and then subtract. Consolidating it here keeps the rounding contract identical
/// everywhere and gives the money math a place to be unit-tested.
/// </summary>
public static class PlatformFeeCalculator
{
    /// <summary>
    /// Splits <paramref name="gross"/> into the platform fee and the tutor net.
    /// The fee rounds half-away-from-zero to 2 decimals, matching the
    /// <c>numeric(12,2)</c> money columns.
    /// </summary>
    /// <param name="gross">Gross session earning. Must be non-negative.</param>
    /// <param name="rate">Snapshot commission rate. Must be in [0,1).</param>
    public static (decimal Fee, decimal Net) SplitGross(decimal gross, decimal rate)
    {
        if (gross < 0m)
        {
            throw new ArgumentOutOfRangeException(nameof(gross), gross, "Gross amount cannot be negative.");
        }

        if (rate < 0m || rate >= 1m)
        {
            throw new ArgumentOutOfRangeException(nameof(rate), rate, "Commission rate must be in [0,1).");
        }

        var fee = Math.Round(gross * rate, 2, MidpointRounding.AwayFromZero);
        return (fee, gross - fee);
    }
}
