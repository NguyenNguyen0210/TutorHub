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

    // --- 12-Hour Grace Period (Auto-Payout) ---
    public DateTime? GracePeriodStartedAt { get; private set; }
    public DateTime? GracePeriodEndsAt { get; private set; }
    public bool HasIssueReport { get; private set; } = false;
    public string? IssueReportReason { get; private set; }
    public string? IssueReportDescription { get; private set; }
    public DateTime? IssueReportedAt { get; private set; }
    public Guid? IssueReportedByUserId { get; private set; }

    // --- Payout linkage (used for idempotency by Application layer) ---
    public bool IsPayoutReleased { get; private set; } = false;

    // --- Admin resolution fields ---
    public string? ResolutionNotes { get; private set; }
    public string? ResolutionSource { get; private set; }
    public Guid? ResolvedByAdminId { get; private set; }

    // =======================================================
    // Domain Methods
    // =======================================================

    /// <summary>
    /// Starts the 12-hour grace period after a session ends.
    /// Transitions: Scheduled → AwaitingPayout.
    /// </summary>
    public bool TryStartGracePeriod(DateTime now, TimeSpan graceDuration)
    {
        if (Status != SessionStatus.Scheduled)
            return false;
        if (!EndAt.HasValue || EndAt.Value > now)
            return false;
        if (GracePeriodStartedAt.HasValue)
            return false; // Already started

        Status = SessionStatus.AwaitingPayout;
        GracePeriodStartedAt = now;
        GracePeriodEndsAt = now.Add(graceDuration);
        UpdatedAt = now;
        return true;
    }

    /// <summary>
    /// Student reports an issue during grace period. Freezes auto-payout.
    /// </summary>
    public void ReportIssue(Guid studentUserId, string reason, string description, DateTime now)
    {
        if (Status != SessionStatus.AwaitingPayout)
        {
            throw new InvalidOperationException(
                $"Cannot report issue for a session in '{Status}' status. Session must be in AwaitingPayout.");
        }

        if (HasIssueReport)
        {
            throw new InvalidOperationException("An issue has already been reported for this session.");
        }

        HasIssueReport = true;
        IssueReportReason = reason;
        IssueReportDescription = description;
        IssueReportedAt = now;
        IssueReportedByUserId = studentUserId;
        UpdatedAt = now;
    }

    /// <summary>
    /// Auto-completes the session when grace period expires with no issue report.
    /// Sets IsPayoutReleased = true.
    /// </summary>
    public void AutoComplete(DateTime now)
    {
        if (Status != SessionStatus.AwaitingPayout)
        {
            throw new InvalidOperationException(
                $"Cannot auto-complete a session in '{Status}' status.");
        }

        if (HasIssueReport)
        {
            throw new InvalidOperationException(
                "Cannot auto-complete a session with an active issue report.");
        }

        if (IsPayoutReleased)
        {
            throw new InvalidOperationException(
                "Payout for this session has already been released.");
        }

        Status = SessionStatus.Completed;
        IsPayoutReleased = true;
        CompletedAt = now;
        UpdatedAt = now;
    }

    /// <summary>
    /// Direct completion of a session.
    /// </summary>
    public void Complete(DateTime? now = null)
    {
        var timestamp = now ?? DateTime.UtcNow;
        Status = SessionStatus.Completed;
        IsPayoutReleased = true;
        CompletedAt = timestamp;
        UpdatedAt = timestamp;
    }

    /// <summary>
    /// Sets or updates the schedule for this Session.
    /// Valid from Unscheduled or Scheduled status.
    /// </summary>
    public void Schedule(DateTime startAt, DateTime endAt)
    {
        if (Status == SessionStatus.Completed || Status == SessionStatus.AwaitingPayout)
        {
            throw new InvalidOperationException(
                $"Cannot schedule a session in '{Status}' status.");
        }

        if (Status == SessionStatus.Cancelled)
        {
            throw new InvalidOperationException(
                "Cannot schedule a cancelled session.");
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
    /// Mutates the schedule of an already Scheduled session.
    /// </summary>
    public void Reschedule(DateTime newStartAt, DateTime newEndAt, DateTime now)
    {
        if (Status != SessionStatus.Scheduled || !StartAt.HasValue || !EndAt.HasValue)
        {
            throw new InvalidOperationException(
                $"Cannot reschedule a session in '{Status}' status. Session must be Scheduled with an existing schedule.");
        }

        if (newEndAt <= newStartAt)
        {
            throw new InvalidOperationException(
                "Session EndAt must be after StartAt.");
        }

        StartAt = newStartAt;
        EndAt = newEndAt;
        UpdatedAt = now;
    }

    /// <summary>
    /// Admin resolution for disputed sessions.
    /// </summary>
    public void CompleteByAdmin(Guid adminId, string resolutionNotes, string resolutionSource, DateTime now, bool releasePayout = false)
    {
        if (Status != SessionStatus.AwaitingPayout && Status != SessionStatus.Scheduled)
        {
            throw new InvalidOperationException(
                $"Only AwaitingPayout or Scheduled sessions can be resolved by admin. Current status: '{Status}'.");
        }

        ResolvedByAdminId = adminId;
        ResolutionNotes = resolutionNotes;
        ResolutionSource = resolutionSource;
        HasIssueReport = false;
        Status = SessionStatus.Completed;
        CompletedAt = now;
        UpdatedAt = now;
        if (releasePayout)
        {
            IsPayoutReleased = true;
        }
    }

    /// <summary>
    /// Cancels a single session on participant request.
    /// </summary>
    public void CancelSingle(string reason, DateTime now)
    {
        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new ArgumentException("Cancellation reason is required.", nameof(reason));
        }

        if (Status == SessionStatus.Completed)
        {
            throw new InvalidOperationException("Cannot cancel a completed session.");
        }

        if (Status == SessionStatus.Cancelled)
        {
            throw new InvalidOperationException("Session is already cancelled.");
        }

        if (Status == SessionStatus.AwaitingPayout)
        {
            throw new InvalidOperationException("Cannot cancel a session that is awaiting payout. Use issue report instead.");
        }

        if (Status == SessionStatus.Scheduled && StartAt.HasValue && StartAt.Value <= now)
        {
            throw new InvalidOperationException("Cannot cancel a session that has already started.");
        }

        if (Status != SessionStatus.Unscheduled && Status != SessionStatus.Scheduled)
        {
            throw new InvalidOperationException(
                $"Cannot cancel a session in '{Status}' status.");
        }

        Status = SessionStatus.Cancelled;
        CancelledAt = now;
        UpdatedAt = now;
        ResolutionNotes = reason.Trim();
        ResolutionSource = "SingleSessionCancel";
    }

    /// <summary>
    /// Cancels the session. Called by Enrollment.Cancel() for bulk cancellation.
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
