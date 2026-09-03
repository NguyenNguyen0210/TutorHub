namespace TutorHub.Domain.Entities;

public class Wallet
{
    public Guid Id { get; set; }

    public Guid TutorProfileId { get; set; }
    public TutorProfile TutorProfile { get; set; } = default!;

    // Money waiting for release
    public decimal PendingBalance { get; set; }

    // Money available for withdrawal
    public decimal AvailableBalance { get; set; }

    // Money held due to active dispute (DEC-S8-001, DEC-S8-028, DEC-S8-034)
    public decimal HeldBalance { get; set; }

    // Authoritative withdrawable balance (INV-LEDGER-005)
    public decimal WithdrawableBalance => AvailableBalance - HeldBalance;

    public DateTime UpdatedAt { get; set; }

    // Relationships
    public ICollection<Withdrawal> Withdrawals { get; set; }
        = new List<Withdrawal>();

    public ICollection<WalletTransaction> WalletTransactions { get; set; }
        = new List<WalletTransaction>();
}