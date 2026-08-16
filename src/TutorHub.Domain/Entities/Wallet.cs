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

    public DateTime UpdatedAt { get; set; }

    // Relationships
    public ICollection<Withdrawal> Withdrawals { get; set; }
        = new List<Withdrawal>();
}