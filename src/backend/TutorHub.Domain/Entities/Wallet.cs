using System.ComponentModel.DataAnnotations.Schema;
namespace TutorHub.Domain.Entities;

public class Wallet
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public Guid? TutorProfileId { get; set; }
    public TutorProfile? TutorProfile { get; set; }

    public Guid? StudentProfileId { get; set; }
    public StudentProfile? StudentProfile { get; set; }

    // 3-Bucket Balance Model
    public decimal AvailableBalance { get; set; }
    public decimal PendingBalance { get; set; }
    public decimal WithdrawingBalance { get; set; }

    public decimal TotalBalance => AvailableBalance + PendingBalance + WithdrawingBalance;
    public decimal WithdrawableBalance => AvailableBalance;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public void CreditAvailable(decimal amount, DateTime now)
    {
        if (amount <= 0)
            throw new ArgumentException("Credit amount must be positive.", nameof(amount));

        AvailableBalance += amount;
        UpdatedAt = now;
    }

    public void DebitAvailable(decimal amount, DateTime now)
    {
        if (amount <= 0)
            throw new ArgumentException("Debit amount must be positive.", nameof(amount));

        if (AvailableBalance < amount)
            throw new InvalidOperationException($"Insufficient wallet balance. Available: {AvailableBalance:N0} VND, Required: {amount:N0} VND.");

        AvailableBalance -= amount;
        UpdatedAt = now;
    }

    public void CreditPending(decimal amount, DateTime now)
    {
        if (amount <= 0)
            throw new ArgumentException("Credit amount must be positive.", nameof(amount));

        PendingBalance += amount;
        UpdatedAt = now;
    }

    public void DebitPending(decimal amount, DateTime now)
    {
        if (amount <= 0)
            throw new ArgumentException("Debit amount must be positive.", nameof(amount));

        if (PendingBalance < amount)
            throw new InvalidOperationException("Pending escrow balance is insufficient.");

        PendingBalance -= amount;
        UpdatedAt = now;
    }

    public void TransferPendingToAvailable(decimal gross, decimal net, DateTime now)
    {
        DebitPending(gross, now);
        CreditAvailable(net, now);
    }

    public void HoldForWithdrawal(decimal amount, DateTime now)
    {
        DebitAvailable(amount, now);
        WithdrawingBalance += amount;
        UpdatedAt = now;
    }

    public void CompleteWithdrawal(decimal amount, DateTime now)
    {
        if (amount <= 0)
            throw new ArgumentException("Complete withdrawal amount must be positive.", nameof(amount));

        if (WithdrawingBalance < amount)
            throw new InvalidOperationException("Withdrawing balance is insufficient to complete withdrawal.");

        WithdrawingBalance -= amount;
        UpdatedAt = now;
    }

    public void ReleaseWithdrawal(decimal amount, DateTime now)
    {
        if (amount <= 0)
            throw new ArgumentException("Release withdrawal amount must be positive.", nameof(amount));

        if (WithdrawingBalance < amount)
            throw new InvalidOperationException("Cannot release more than currently withdrawing balance.");

        WithdrawingBalance -= amount;
        AvailableBalance += amount;
        UpdatedAt = now;
    }

    // Aliases for backward compatibility
    public void Credit(decimal amount, DateTime now) => CreditAvailable(amount, now);
    public void Debit(decimal amount, DateTime now) => DebitAvailable(amount, now);
    public void DebitAvailableForWithdrawal(decimal amount, DateTime now) => HoldForWithdrawal(amount, now);

    // Relationships
    public ICollection<WalletTransaction> WalletTransactions { get; set; } = new List<WalletTransaction>();
    [NotMapped]
    public ICollection<WalletTransaction> Transactions => WalletTransactions;

    public ICollection<Withdrawal> Withdrawals { get; set; } = new List<Withdrawal>();

    public ICollection<TopUpRequest> TopUpRequests { get; set; } = new List<TopUpRequest>();
}
