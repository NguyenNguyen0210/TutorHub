using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class WalletTransaction
{
    public Guid Id { get; set; }

    public Guid WalletId { get; set; }
    public Wallet Wallet { get; set; } = default!;

    public Guid StudentWalletId { get => WalletId; set => WalletId = value; }
    public Wallet StudentWallet { get => Wallet; set => Wallet = value; }

    public Guid? WithdrawalId { get; set; }
    public Withdrawal? Withdrawal { get; set; }

    public Guid? DisputeId { get; set; }

    public WalletTransactionType Type { get; set; }
    public FinancialDirection Direction { get; set; }

    public decimal Amount { get; set; }
    public decimal BalanceBefore { get; set; }
    public decimal BalanceAfter { get; set; }

    public string? ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }

    public string? Description { get; set; }
    public string? Reason { get; set; }

    public Guid? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

