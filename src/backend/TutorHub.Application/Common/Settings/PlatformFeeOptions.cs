using System.ComponentModel.DataAnnotations;

namespace TutorHub.Application.Common.Settings;

/// <summary>
/// Platform fee configuration options (DEC-S8-020).
/// Binds from configuration ("PlatformFee" section or "PlatformFeeRate" key in .env).
/// </summary>
public class PlatformFeeOptions
{
    public const string SectionName = "PlatformFee";

    [Required(ErrorMessage = "Platform fee rate is required.")]
    [Range(typeof(decimal), "0.0", "0.9999", ErrorMessage = "Platform fee rate must be between 0.0 and 0.9999.")]
    public decimal? Rate { get; set; } = 0.10m;

    /// <summary>
    /// Alias for Rate to support flat "PlatformFeeRate" configuration binding.
    /// </summary>
    public decimal? PlatformFeeRate
    {
        get => Rate;
        set => Rate = value;
    }
}

