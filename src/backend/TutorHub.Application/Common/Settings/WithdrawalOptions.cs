using System.ComponentModel.DataAnnotations;

namespace TutorHub.Application.Common.Settings;

/// <summary>
/// Platform withdrawal limit options.
/// Binds from configuration ("Withdrawal" section or "MinWithdrawalAmount" key in .env).
/// </summary>
public class WithdrawalOptions
{
    public const string SectionName = "Withdrawal";

    [Range(typeof(decimal), "1000", "1000000000", ErrorMessage = "Minimum withdrawal amount must be at least 1,000 VND.")]
    public decimal MinAmount { get; set; } = 50_000m;

    /// <summary>
    /// Alias to support flat "MinWithdrawalAmount" environment variable.
    /// </summary>
    public decimal MinWithdrawalAmount
    {
        get => MinAmount;
        set => MinAmount = value;
    }
}

