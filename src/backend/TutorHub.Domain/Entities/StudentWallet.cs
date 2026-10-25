namespace TutorHub.Domain.Entities;

public class StudentWallet
{
    public Guid Id { get; set; }

    public Guid StudentProfileId { get; set; }
    public StudentProfile StudentProfile { get; set; } = default!;

    public decimal AvailableBalance { get; set; }
    public decimal WithdrawingBalance { get; set; }
    public decimal TotalBalance => AvailableBalance + WithdrawingBalance;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public void Credit(decimal amount, DateTime now)
    {
        if (amount <= 0)
            throw new ArgumentException("Credit amount must be positive.", nameof(amount));

        AvailableBalance += amount;
        UpdatedAt = now;
    }

    public void Debit(decimal amount, DateTime now)
    {
        if (amount <= 0)
            throw new ArgumentException("Debit amount must be positive.", nameof(amount));

        if (AvailableBalance < amount)
            throw new InvalidOperationException($"Insufficient wallet balance. Available: {AvailableBalance:N0} VND, Required: {amount:N0} VND.");

        AvailableBalance -= amount;
        UpdatedAt = now;
    }

    public void HoldForWithdrawal(decimal amount, DateTime now)
    {
        Debit(amount, now);
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

    public ICollection<StudentWalletTransaction> Transactions { get; set; }
        = new List<StudentWalletTransaction>();

    public ICollection<StudentWithdrawal> Withdrawals { get; set; }
        = new List<StudentWithdrawal>();

    public ICollection<TopUpRequest> TopUpRequests { get; set; }
        = new List<TopUpRequest>();
}
