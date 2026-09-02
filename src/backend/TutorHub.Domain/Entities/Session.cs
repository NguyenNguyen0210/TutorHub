using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class Session
{
    // Identity
    public Guid Id { get; set; }

    // --- Parent Enrollment ---
    public Guid EnrollmentId { get; set; }
    public Enrollment Enrollment { get; set; } = default!;

    // --- Session Metadata ---
    public int SessionNumber { get; set; } // 1-based (1..N)

    // --- Immutable Financial Snapshot ---
    // Set once during Enrollment creation. Never modified.
    public decimal EarningAmount { get; set; }

    // --- Schedule (nullable until Scheduled) ---
    public DateTime? StartAt { get; private set; }
    public DateTime? EndAt { get; private set; }

    // --- Lifecycle ---
    public SessionStatus Status { get; private set; } = SessionStatus.Unscheduled;

    // --- Timestamps ---
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public DateTime? CancelledAt { get; private set; }

    // --- Payout linkage (used for idempotency by Application layer) ---
    // Application layer uses this to verify payout has not been done
    public bool IsPayoutReleased { get; private set; } = false;
    public Transaction? Transaction { get; set; }

    // =======================================================
    // Domain Methods
    // =======================================================

    /// <summary>
    /// Sets or updates the schedule for this Session.
    /// Valid from Unscheduled or Scheduled status.
    /// Throws if already Completed or Cancelled.
    /// </summary>
    public void Schedule(DateTime startAt, DateTime endAt)
    {
        if (Status == SessionStatus.Completed)
        {
            throw new InvalidOperationException(
                "Cannot reschedule a completed session.");
        }

        if (Status == SessionStatus.Cancelled)
        {
            throw new InvalidOperationException(
                "Cannot reschedule a cancelled session.");
        }

        if (endAt <= startAt)
        {
            throw new InvalidOperationException(
                "Session EndAt must be after StartAt.");
        }

        StartAt = startAt;
        EndAt = endAt;
        Status = SessionStatus.Scheduled;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Marks the session as completed and flags payout as released.
    /// Can only be called once. Throws if not Scheduled or already processed.
    /// </summary>
    public void Complete()
    {
        if (Status != SessionStatus.Scheduled)
        {
            throw new InvalidOperationException(
                $"Cannot complete a session in '{Status}' status. Session must be Scheduled.");
        }

        if (IsPayoutReleased)
        {
            throw new InvalidOperationException(
                "Payout for this session has already been released.");
        }

        Status = SessionStatus.Completed;
        IsPayoutReleased = true;
        CompletedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Cancels the session. Called by Enrollment.Cancel() for bulk cancellation.
    /// Only valid from Unscheduled or Scheduled.
    /// </summary>
    public void CancelFromEnrollment()
    {
        if (Status == SessionStatus.Completed)
        {
            throw new InvalidOperationException(
                "Cannot cancel a completed session.");
        }

        if (Status == SessionStatus.Cancelled)
        {
            return; // idempotent for bulk cancel
        }

        Status = SessionStatus.Cancelled;
        CancelledAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}
