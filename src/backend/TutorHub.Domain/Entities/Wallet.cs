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

    // F-23: balance mutations go through guarded domain methods so the
    // DEC-WD-001 / DEC-S8-001 / DEC-S8-028 invariants live in one place.
    // Handlers own persistence (locks, transactions); this class owns math.

    public void CreditPending(decimal amount, DateTime now)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount must be positive.", nameof(amount));
        PendingBalance += amount;
        UpdatedAt = now;
    }

    public void DebitPending(decimal amount, DateTime now)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount must be positive.", nameof(amount));
        if (PendingBalance < amount)
            throw new InvalidOperationException("Pending escrow balance is insufficient.");
        PendingBalance -= amount;
        UpdatedAt = now;
    }

    public void CreditAvailable(decimal amount, DateTime now)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount must be positive.", nameof(amount));
        AvailableBalance += amount;
        UpdatedAt = now;
    }

    public void DebitAvailableForWithdrawal(decimal amount, DateTime now)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount must be positive.", nameof(amount));
        if (WithdrawableBalance < amount)
            throw new InvalidOperationException("Insufficient withdrawable balance.");
        AvailableBalance -= amount;
        UpdatedAt = now;
    }

    public void Hold(decimal amount, DateTime now)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount must be positive.", nameof(amount));
        if (WithdrawableBalance < amount)
            throw new InvalidOperationException(
                "Withdrawable balance is insufficient for the required hold (DEC-S8-028: no partial holds).");
        HeldBalance += amount;
        UpdatedAt = now;
    }

    public void ReleaseHold(decimal amount, DateTime now)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount must be positive.", nameof(amount));
        if (HeldBalance < amount)
            throw new InvalidOperationException("Cannot release more hold than is currently held.");
        HeldBalance -= amount;
        UpdatedAt = now;
    }

    public void DebitAvailable(decimal amount, DateTime now)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount must be positive.", nameof(amount));
        if (AvailableBalance < amount)
            throw new InvalidOperationException("Available balance is insufficient for the required debit.");
        AvailableBalance -= amount;
        UpdatedAt = now;
    }

    // Relationships
    public ICollection<Withdrawal> Withdrawals { get; set; }
        = new List<Withdrawal>();

    public ICollection<WalletTransaction> WalletTransactions { get; set; }
        = new List<WalletTransaction>();
}