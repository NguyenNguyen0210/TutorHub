namespace TutorHub.Domain.Entities;

public class TutorWallet
{
    public Guid Id { get; set; }

    public Guid TutorProfileId { get; set; }
    public TutorProfile TutorProfile { get; set; } = default!;

    // Money waiting for release
    public decimal PendingBalance { get; set; }

    // Money available for withdrawal
    public decimal AvailableBalance { get; set; }

    // Authoritative withdrawable balance. Alias of AvailableBalance since disputes are pre-release only.
    public decimal WithdrawableBalance => AvailableBalance;

    public DateTime UpdatedAt { get; set; }

    // balance mutations go through guarded domain methods so the
    // Wallet balance constraints.
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
        if (AvailableBalance < amount)
            throw new InvalidOperationException("Insufficient withdrawable balance.");
        AvailableBalance -= amount;
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
    public ICollection<TutorWithdrawal> Withdrawals { get; set; }
        = new List<TutorWithdrawal>();

    public ICollection<TutorWalletTransaction> WalletTransactions { get; set; }
        = new List<TutorWalletTransaction>();
}
