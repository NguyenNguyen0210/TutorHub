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

    // Default hourly rate (Legacy compatibility field - to be replaced by Service in Sprint 3)
    public decimal HourlyRate { get; set; }

    // Teaching mode
    public TeachingMode TeachingMode { get; set; }

    // Offline location
    public string? Address { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    // Denormalized review statistics
    public decimal RatingAvg { get; set; } = 0;
    public int TotalReviews { get; set; } = 0;

    // Domain relationships
    public ICollection<TutorSubject> TutorSubjects { get; set; }
        = new List<TutorSubject>();

    public ICollection<AvailabilitySlot> AvailabilitySlots { get; set; }
        = new List<AvailabilitySlot>();

    public Wallet? Wallet { get; set; }
}