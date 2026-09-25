using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class TutorWalletTransaction
{
    public Guid Id { get; set; }

    public Guid WalletId { get; set; }
    public TutorWallet Wallet { get; set; } = default!;

    public Guid? WithdrawalId { get; set; }
    public TutorWithdrawal? Withdrawal { get; set; }

    public Guid? DisputeId { get; set; }

    public TutorWalletTransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public string? Description { get; set; }

    public Guid? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
