using System.ComponentModel.DataAnnotations;

namespace TutorHub.Application.Common.Settings;

/// <summary>
/// Session scheduling policies.
/// Binds from configuration ("Scheduling" section or "Scheduling__MinimumNoticeHours" in .env).
/// </summary>
public class SchedulingOptions
{
    public const string SectionName = "Scheduling";

    [Range(0, 168, ErrorMessage = "Minimum notice hours must be between 0 and 168 hours.")]
    public int MinimumNoticeHours { get; set; } = 2;
}

