using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class Booking
{
    public Guid Id { get; set; }

    // Student
    public Guid StudentProfileId { get; set; }
    public StudentProfile StudentProfile { get; set; } = default!;

    // Tutor
    public Guid TutorProfileId { get; set; }
    public TutorProfile TutorProfile { get; set; } = default!;

    // Subject
    public Guid SubjectId { get; set; }
    public Subject Subject { get; set; } = default!;

    // Schedule
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }

    // Pricing
    public decimal HourlyRate { get; set; }
    public decimal TotalAmount { get; set; }

    // Lifecycle
    public BookingStatus Status { get; set; }

    // Temporary holding
    public DateTime? HoldingExpiresAt { get; set; }

    // Confirmation
    public DateTime? ConfirmedAt { get; set; }

    // Completion
    public DateTime? CompletedAt { get; set; }

    // Cancellation
    public DateTime? CancelledAt { get; set; }
    public CancelledBy? CancelledBy { get; set; }
    public string? CancellationReason { get; set; }

    public DateTime CreatedAt { get; set; }


    // Relationships
    public Transaction? Transaction { get; set; }

    public ICollection<Review> Reviews { get; set; }
        = new List<Review>();

    public ICollection<Report> Reports { get; set; }
        = new List<Report>();
}