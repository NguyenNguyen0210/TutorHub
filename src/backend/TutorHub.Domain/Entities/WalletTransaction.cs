using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class WalletTransaction
{
    public Guid Id { get; set; }

    public Guid WalletId { get; set; }
    public Wallet Wallet { get; set; } = default!;

    public Guid? WithdrawalId { get; set; }
    public Withdrawal? Withdrawal { get; set; }

    public WalletTransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public string? Description { get; set; }

    public Guid? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
