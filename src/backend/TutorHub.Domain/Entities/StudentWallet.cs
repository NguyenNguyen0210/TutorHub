namespace TutorHub.Domain.Entities;

public class StudentWallet
{
    public Guid Id { get; set; }

    public Guid StudentProfileId { get; set; }
    public StudentProfile StudentProfile { get; set; } = default!;

    public decimal AvailableBalance { get; set; }
    public decimal ReservedBalance { get; set; }
    public decimal TotalBalance => AvailableBalance + ReservedBalance;

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

    public void ReserveForWithdrawal(decimal amount, DateTime now)
    {
        Debit(amount, now);
        ReservedBalance += amount;
        UpdatedAt = now;
    }

    public void FinalizeWithdrawal(decimal amount, DateTime now)
    {
        if (amount <= 0)
            throw new ArgumentException("Finalize withdrawal amount must be positive.", nameof(amount));

        if (ReservedBalance < amount)
            throw new InvalidOperationException("Reserved balance is insufficient to finalize withdrawal.");

        ReservedBalance -= amount;
        UpdatedAt = now;
    }

    public void ReleaseWithdrawalReservation(decimal amount, DateTime now)
    {
        if (amount <= 0)
            throw new ArgumentException("Release withdrawal amount must be positive.", nameof(amount));

        if (ReservedBalance < amount)
            throw new InvalidOperationException("Cannot release more than currently reserved balance.");

        ReservedBalance -= amount;
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
