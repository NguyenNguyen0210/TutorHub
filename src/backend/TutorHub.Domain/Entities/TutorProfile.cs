using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class TutorProfile
{
    public Guid Id { get; set; }

    // Identity
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    // Tutor information
    public string Bio { get; set; } = default!;
    public string Education { get; set; } = default!;
    public int ExperienceYears { get; set; }

    // Teaching mode
    public TeachingMode TeachingMode { get; set; }

    // Offline location
    public string? Address { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    // Denormalized review statistics
    public decimal RatingAvg { get; set; } = 0;
    public int TotalReviews { get; set; } = 0;

    // Default Payout Bank Destination (DEC-WD-002)
    public string? BankName { get; set; }
    public string? BankCode { get; set; }
    public string? AccountNumber { get; set; }
    public string? AccountHolderName { get; set; }

    public void SetPayoutAccount(string bankName, string accountNumber, string accountHolderName, string? bankCode = null)
    {
        if (string.IsNullOrWhiteSpace(bankName))
            throw new ArgumentException("Bank name cannot be empty.", nameof(bankName));
        if (string.IsNullOrWhiteSpace(accountNumber))
            throw new ArgumentException("Account number cannot be empty.", nameof(accountNumber));
        if (string.IsNullOrWhiteSpace(accountHolderName))
            throw new ArgumentException("Account holder name cannot be empty.", nameof(accountHolderName));

        BankName = bankName.Trim();
        BankCode = string.IsNullOrWhiteSpace(bankCode) ? null : bankCode.Trim().ToUpperInvariant();
        AccountNumber = accountNumber.Trim();
        AccountHolderName = accountHolderName.Trim().ToUpperInvariant();
    }

    // Domain relationships
    public ICollection<TutorSubject> TutorSubjects { get; set; }
        = new List<TutorSubject>();

    public ICollection<Service> Services { get; set; }
        = new List<Service>();

    public ICollection<AvailabilitySlot> AvailabilitySlots { get; set; }
        = new List<AvailabilitySlot>();

    public Wallet? Wallet { get; set; }
}