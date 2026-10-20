namespace TutorHub.Application.Features.PlatformSettings.Commands.AdminUpsertPlatformSetting;

/// <summary>
/// F-17 plumbing keys. Defaults mirror current code behavior; policy values
/// themselves are decided under D-01..D-08 and must not be invented here.
/// </summary>
public static class PlatformSettingKeys
{
    /// <summary>
    /// Platform commission rate snapshot source (DEC-S8-020). Deliberately NOT part of
    /// <see cref="All"/>: it is writable only through the dedicated AdminUpdatePlatformFee
    /// endpoint (so every change records a version + reason), and enrollment activation
    /// reads it with no fallback.
    /// </summary>
    public const string PlatformFeeRate = "PlatformFeeRate";

    public const string ReviewWindowDays = "ReviewWindowDays";

    public static readonly string[] All =
    {
        ReviewWindowDays
    };

    public static readonly Dictionary<string, string> Defaults = new()
    {
        // 30d matches review eligibility window in CreateEnrollmentReview today.
        [ReviewWindowDays] = "30"
    };
}
