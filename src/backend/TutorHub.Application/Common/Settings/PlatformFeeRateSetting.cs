using System.Globalization;

namespace TutorHub.Application.Common.Settings;

/// <summary>
/// P0-A1 / P0-E3: the single definition of a *usable* platform fee setting.
///
/// Enrollment activation snapshots this value (DEC-S8-020) and readiness reports it,
/// so both must agree on what "configured" means: an invariant-culture decimal in
/// [0,1). A machine culture that uses '.' as a group separator must not turn a valid
/// rate into a rejected one, and a rejected rate must never be silently defaulted.
/// </summary>
public static class PlatformFeeRateSetting
{
    public static bool TryParse(string? value, out decimal feeRate)
    {
        return decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out feeRate)
               && feeRate >= 0m
               && feeRate < 1m;
    }
}
