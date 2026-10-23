using System.ComponentModel.DataAnnotations;

namespace TutorHub.Application.Common.Settings;

/// <summary>
/// Review submission policy options.
/// Binds from configuration ("Review" section or "ReviewWindowDays" key in .env).
/// </summary>
public class ReviewOptions
{
    public const string SectionName = "Review";

    [Range(1, 365, ErrorMessage = "Review window must be between 1 and 365 days.")]
    public int WindowDays { get; set; } = 30;

    /// <summary>
    /// Alias to support flat "ReviewWindowDays" environment variable.
    /// </summary>
    public int ReviewWindowDays
    {
        get => WindowDays;
        set => WindowDays = value;
    }
}

