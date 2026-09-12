using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class Enrollment
{
    // Identity
    public Guid Id { get; set; }

    // --- Commercial Provenance ---
    // Reference to the purchase order
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = default!;

    // --- Participants ---
    public Guid StudentProfileId { get; set; }
    public StudentProfile StudentProfile { get; set; } = default!;

    public Guid TutorProfileId { get; set; }
    public TutorProfile TutorProfile { get; set; } = default!;

    // --- Service Provenance (reference only, NOT source of truth for pricing) ---
    public Guid ServiceId { get; set; }
    public Service Service { get; set; } = default!;

    public Guid SubjectId { get; set; }
    public Subject Subject { get; set; } = default!;

    // --- Immutable Learning Contract Snapshot ---
    // Set once at creation. Never recalculated from Service.
    public decimal TotalPrice { get; set; }
    public int TotalSessions { get; set; }
    public int SessionDurationMinutes { get; set; }
    public TeachingMode TeachingMode { get; set; }

    // --- Platform Fee Snapshot (DEC-S8-020) ---
    public decimal PlatformFeeRate { get; set; } = 0.10m;
    public int FeePolicyVersion { get; set; } = 1;

    // --- Progress (mutable, tracks completion) ---
    public int CompletedSessions { get; private set; } = 0;

    // --- Lifecycle (F-15: Pending → Active → Completed / Cancelled) ---
    public EnrollmentStatus Status { get; private set; } = EnrollmentStatus.Pending;

    // --- Timestamps ---
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; private set; }
    public DateTime? CancelledAt { get; private set; }
    public CancelledBy? CancelledBy { get; private set; }
    public string? CancellationReason { get; private set; }

    // --- Sessions ---
    public ICollection<Session> Sessions { get; set; } = new List<Session>();

    // --- Review (1:0..1) ---
    public Review? Review { get; set; }

    // =======================================================
    // Domain Methods
    // =======================================================

    /// <summary>
    /// Activates a Pending enrollment after payment escrow is recorded (F-15).
    /// Only valid from Pending.
    /// </summary>
    public void Activate()
    {
        if (Status != EnrollmentStatus.Pending)
        {
            throw new InvalidOperationException(
                $"Cannot activate an enrollment in '{Status}' status. Only Pending enrollments can be activated.");
        }

        Status = EnrollmentStatus.Active;
    }

    /// <summary>
    /// Records that a specific Session has been completed.
    /// Throws if the Enrollment is not Active, or if the session has already been recorded.
    /// Automatically transitions Enrollment to Completed when all sessions are done.
    /// </summary>
    public void RecordCompletedSession(Guid sessionId)
    {
        if (Status != EnrollmentStatus.Active)
        {
            throw new InvalidOperationException(
                $"Cannot record session completion for an enrollment in '{Status}' status.");
        }

        // Guard: check that session belongs to this Enrollment and is actually Completed
        var session = Sessions.FirstOrDefault(s => s.Id == sessionId)
            ?? throw new InvalidOperationException(
                $"Session '{sessionId}' does not belong to this enrollment.");

        if (session.Status != SessionStatus.Completed)
        {
            throw new InvalidOperationException(
                $"Session '{sessionId}' is not in Completed status. Cannot record completion.");
        }

        EvaluateCompletion();
    }

    /// <summary>
    /// Recomputes progress and completes the Enrollment once every Session is
    /// resolved (Completed or Cancelled) and at least one Session was actually
    /// delivered. A single cancelled Session must not block completion
    /// (FR-ENR-005, FR-SESSION-007). An all-cancelled enrollment is an early
    /// termination and is intentionally NOT auto-completed here; it must go
    /// through cancellation (FR-OPEN-004).
    /// </summary>
    public void EvaluateCompletion()
    {
        if (Status != EnrollmentStatus.Active)
        {
            return;
        }

        CompletedSessions = Sessions.Count(s => s.Status == SessionStatus.Completed);
        var resolvedSessions = Sessions.Count(s =>
            s.Status == SessionStatus.Completed || s.Status == SessionStatus.Cancelled);

        if (CompletedSessions >= 1 && resolvedSessions >= TotalSessions)
        {
            Status = EnrollmentStatus.Completed;
            CompletedAt = DateTime.UtcNow;
        }
    }

    /// <summary>
    /// Cancels the Enrollment and all remaining (non-Completed) sessions.
    /// Valid from Pending (before activation) or Active.
    /// Calculates refundable amount based on unearned sessions.
    /// Returns the RefundAmount to be processed by the Application layer.
    /// </summary>
    public decimal Cancel(string reason, CancelledBy? cancelledBy = null)
    {
        if (Status != EnrollmentStatus.Active && Status != EnrollmentStatus.Pending)
        {
            throw new InvalidOperationException(
                $"Cannot cancel an enrollment in '{Status}' status.");
        }

        Status = EnrollmentStatus.Cancelled;
        CancelledAt = DateTime.UtcNow;
        CancellationReason = reason;
        CancelledBy = cancelledBy;

        // Cancel all non-completed sessions
        foreach (var session in Sessions.Where(s => s.Status != SessionStatus.Completed))
        {
            session.CancelFromEnrollment();
        }

        // Refund = TotalPrice - sum of EarningAmounts of completed sessions only
        var earnedAmount = Sessions
            .Where(s => s.Status == SessionStatus.Completed)
            .Sum(s => s.EarningAmount);

        return TotalPrice - earnedAmount;
    }
}
