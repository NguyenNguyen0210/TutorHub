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

    // Commercial Terms Snapshot from Service or CustomAgreement (INV-AGREE-008, INV-AGREE-009)
    public Guid? ServiceId { get; set; }
    public Service? Service { get; set; }

    public Guid? CustomAgreementId { get; set; }
    public CustomAgreement? CustomAgreement { get; set; }
    public decimal TotalPrice { get; set; }
    public int TotalSessions { get; set; }
    public int SessionDurationMinutes { get; set; }
    public TeachingMode TeachingMode { get; set; }

    // Lifecycle
    public BookingStatus Status { get; set; }

    // Temporary holding (15m checkout lock)
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
    public Enrollment? Enrollment { get; set; }
    public Transaction? Transaction { get; set; }

    public ICollection<Report> Reports { get; set; }
        = new List<Report>();

    // =======================================================
    // Domain Methods
    // =======================================================

    public bool CanCancel(CancelledBy actor)
    {
        if (Status == BookingStatus.Completed || Status == BookingStatus.Cancelled || Status == BookingStatus.Expired)
        {
            return false;
        }

        if (actor == Enums.CancelledBy.Tutor)
        {
            return Status == BookingStatus.Pending || Status == BookingStatus.Confirmed;
        }

        if (actor == Enums.CancelledBy.Student)
        {
            return Status == BookingStatus.Holding || Status == BookingStatus.Pending || Status == BookingStatus.Confirmed;
        }

        return true; // Admin / System
    }

    public (decimal RefundPercentage, decimal RefundAmount, decimal PayoutAmount) CalculateRefund(CancelledBy actor)
    {
        if (Status == BookingStatus.Holding)
        {
            return (0, 0, 0);
        }

        // If cancelled prior to enrollment activation, unactivated booking gets 100% refund
        return (100, TotalPrice, 0);
    }

    public void Cancel(CancelledBy actor, string? reason, DateTime now)
    {
        if (!CanCancel(actor))
        {
            throw new InvalidOperationException($"Cannot cancel booking in '{Status}' status.");
        }

        Status = BookingStatus.Cancelled;
        CancelledBy = actor;
        CancellationReason = reason;
        CancelledAt = now;
    }
}
