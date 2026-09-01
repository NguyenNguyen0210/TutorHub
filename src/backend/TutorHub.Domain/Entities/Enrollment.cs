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

    // --- Progress (mutable, tracks completion) ---
    public int CompletedSessions { get; private set; } = 0;

    // --- Lifecycle ---
    public EnrollmentStatus Status { get; private set; } = EnrollmentStatus.Active;

    // --- Timestamps ---
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; private set; }
    public DateTime? CancelledAt { get; private set; }
    public string? CancellationReason { get; private set; }

    // --- Sessions ---
    public ICollection<Session> Sessions { get; set; } = new List<Session>();

    // =======================================================
    // Domain Methods
    // =======================================================

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

        CompletedSessions = Sessions.Count(s => s.Status == SessionStatus.Completed);

        if (CompletedSessions >= TotalSessions)
        {
            Status = EnrollmentStatus.Completed;
            CompletedAt = DateTime.UtcNow;
        }
    }

    /// <summary>
    /// Cancels the Enrollment and all remaining (non-Completed) sessions.
    /// Calculates refundable amount based on unearned sessions.
    /// Returns the RefundAmount to be processed by the Application layer.
    /// </summary>
    public decimal Cancel(string reason)
    {
        if (Status != EnrollmentStatus.Active)
        {
            throw new InvalidOperationException(
                $"Cannot cancel an enrollment in '{Status}' status.");
        }

        Status = EnrollmentStatus.Cancelled;
        CancelledAt = DateTime.UtcNow;
        CancellationReason = reason;

        // Cancel all non-completed sessions
        foreach (var session in Sessions.Where(s => s.Status != SessionStatus.Completed))
        {
            session.CancelFromEnrollment();
        }

        // Refund = TotalPrice − sum of EarningAmounts of completed sessions only
        var earnedAmount = Sessions
            .Where(s => s.Status == SessionStatus.Completed)
            .Sum(s => s.EarningAmount);

        return TotalPrice - earnedAmount;
    }
}
