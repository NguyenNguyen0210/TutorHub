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
    // P0 HOTFIX: a booking owns MANY transactions (initial payment + per-session
    // payouts + refunds/reversals). The previous 1:1 mapping + unique index made
    // the 2nd payout of any package fail and corrupted tracking via orphan deletion.
    public Enrollment? Enrollment { get; set; }
    public ICollection<Transaction> Transactions { get; set; }
        = new List<Transaction>();

    public ICollection<Report> Reports { get; set; }
        = new List<Report>();

    // =======================================================
    // Domain Methods
    // =======================================================

    public bool CanCancel(CancelledBy actor)
    {
        // Booking-level cancellation is only valid for the unpaid 15-minute
        // Holding checkout. Once Paid, an Enrollment + escrow exist and all
        // cancellation/refund must go through Enrollment.Cancel (pro-rata) so
        // sessions and wallet stay consistent (FR-CANCEL-003/004, PRD §8.1).
        if (Status != BookingStatus.Holding)
        {
            return false;
        }

        // The tutor has no action on an unpaid student checkout hold.
        return actor != Enums.CancelledBy.Tutor;
    }

    public (decimal RefundPercentage, decimal RefundAmount, decimal PayoutAmount) CalculateRefund(CancelledBy actor)
    {
        if (Status != BookingStatus.Holding)
        {
            throw new InvalidOperationException(
                "Booking-level refund is only valid for an unpaid Holding booking. Use Enrollment cancellation.");
        }

        // An unpaid holding moved no money.
        return (0, 0, 0);
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
