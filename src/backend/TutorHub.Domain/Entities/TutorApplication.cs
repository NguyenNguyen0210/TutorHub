using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

/// <summary>
/// Represents one review cycle for a user applying to become a Tutor.
/// A User may have multiple TutorApplication records over time,
/// but at most one Pending and at most one Approved application.
///
/// State machine:
///   (new) → Pending
///   Pending → Approved  (Admin approves)
///   Pending → Rejected  (Admin rejects, reason required)
///   Rejected → (new application created) → Pending
///
/// Approved is terminal for this record.
/// Account suspension uses User.Status, not TutorApplication.
/// </summary>
public class TutorApplication
{
    public Guid Id { get; set; }

    // Applicant
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    // Application content — snapshot at submission time
    public string Bio { get; set; } = default!;
    public string Education { get; set; } = default!;
    public int ExperienceYears { get; set; }
    public TeachingMode TeachingMode { get; set; }
    public string? Address { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    // Lifecycle
    public TutorApplicationStatus Status { get; private set; }
        = TutorApplicationStatus.Pending;

    public DateTime SubmittedAt { get; set; }

    // Review audit (populated on Approve/Reject)
    public string? RejectionReason { get; private set; }
    public Guid? ReviewedByAdminId { get; private set; }
    public User? ReviewedByAdmin { get; private set; }
    public DateTime? ReviewedAt { get; private set; }

    // ── State machine methods ──────────────────────────────────────────

    /// <summary>
    /// Transition: Pending → Approved.
    /// Called by Admin approve handler. Creates TutorProfile+Wallet in the same transaction.
    /// </summary>
    public void Approve(Guid adminId)
    {
        if (Status != TutorApplicationStatus.Pending)
            throw new InvalidOperationException(
                $"Cannot approve application with status '{Status}'. Only Pending applications can be approved.");

        Status = TutorApplicationStatus.Approved;
        ReviewedByAdminId = adminId;
        ReviewedAt = DateTime.UtcNow;
        RejectionReason = null;
    }

    /// <summary>
    /// Transition: Pending → Rejected.
    /// Reason is mandatory per business invariant INV-TUTOR-002.
    /// </summary>
    public void Reject(string reason, Guid adminId)
    {
        if (Status != TutorApplicationStatus.Pending)
            throw new InvalidOperationException(
                $"Cannot reject application with status '{Status}'. Only Pending applications can be rejected.");

        if (string.IsNullOrWhiteSpace(reason))
            throw new InvalidOperationException("Rejection reason is required.");

        Status = TutorApplicationStatus.Rejected;
        RejectionReason = reason.Trim();
        ReviewedByAdminId = adminId;
        ReviewedAt = DateTime.UtcNow;
    }
}
