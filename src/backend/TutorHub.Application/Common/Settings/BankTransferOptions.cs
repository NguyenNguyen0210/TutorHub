namespace TutorHub.Application.Common.Settings;

/// <summary>
/// Platform bank transfer options for student top-up requests.
/// Binds from configuration ("BankTransfer" section or flat keys in .env).
/// </summary>
public class BankTransferOptions
{
    public const string SectionName = "BankTransfer";

    public string BankName { get; set; } = "Vietcombank";
    public string AccountNumber { get; set; } = "1029384756";
    public string AccountName { get; set; } = "TUTORHUB JSC";

    /// <summary>
    /// Alias to support flat "PlatformBankName" in .env.
    /// </summary>
    public string PlatformBankName
    {
        get => BankName;
        set => BankName = value;
    }

    /// <summary>
    /// Alias to support flat "PlatformBankAccountNo" in .env.
    /// </summary>
    public string PlatformBankAccountNo
    {
        get => AccountNumber;
        set => AccountNumber = value;
    }

    /// <summary>
    /// Alias to support flat "PlatformBankAccountName" in .env.
    /// </summary>
    public string PlatformBankAccountName
    {
        get => AccountName;
        set => AccountName = value;
    }
}

