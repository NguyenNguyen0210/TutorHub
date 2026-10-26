namespace TutorHub.Application.Features.Wallets.DTOs;

public record WalletDto(
    Guid Id,
    Guid? TutorProfileId,
    decimal PendingBalance,
    decimal AvailableBalance,
    decimal WithdrawableBalance,
    decimal PendingWithdrawal,
    decimal TotalBalance,
    DateTime UpdatedAt
)
{
    public Guid? UserId { get; init; }
    public Guid? StudentProfileId { get; init; }

    /// <summary>
    /// Backward-compatibility alias for frontend components expecting WithdrawingBalance (student wallet).
    /// </summary>
    public decimal WithdrawingBalance => PendingWithdrawal;
}
