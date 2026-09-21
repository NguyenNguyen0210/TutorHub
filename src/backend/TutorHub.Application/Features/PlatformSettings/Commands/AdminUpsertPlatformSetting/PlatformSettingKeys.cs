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

    public const string VerificationWindowHours = "VerificationWindowHours";
    public const string ReviewWindowDays = "ReviewWindowDays";
    public const string CancellationPolicy = "CancellationPolicy";
    public const string RefundRules = "RefundRules";
    public const string WithdrawalRules = "WithdrawalRules";

    public static readonly string[] All =
    {
        VerificationWindowHours,
        ReviewWindowDays,
        CancellationPolicy,
        RefundRules,
        WithdrawalRules
    };

    public static readonly Dictionary<string, string> Defaults = new()
    {
        // 24h matches AttendanceVerificationJob + SessionReminderJob today.
        [VerificationWindowHours] = "24",
        // 30d matches review eligibility window in CreateEnrollmentReview today.
        [ReviewWindowDays] = "30",
        // Opaque JSON placeholders; semantics pending D-01/D-03/D-08.
        [CancellationPolicy] = "{}",
        [RefundRules] = "{}",
        [WithdrawalRules] = "{}"
    };
}
