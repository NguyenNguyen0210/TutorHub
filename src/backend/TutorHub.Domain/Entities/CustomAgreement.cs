using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class CustomAgreement
{
    public Guid Id { get; set; }

    // Service Provenance (optional reference if customized from an existing service)
    public Guid? ServiceId { get; set; }
    public Service? Service { get; set; }

    // Conversation Provenance (optional reference if negotiated within chat)
    public Guid? ConversationId { get; set; }
    public Conversation? Conversation { get; set; }

    // Commercial Participants
    public Guid TutorProfileId { get; set; }
    public TutorProfile TutorProfile { get; set; } = default!;

    public Guid StudentProfileId { get; set; }
    public StudentProfile StudentProfile { get; set; } = default!;

    // Subject
    public Guid SubjectId { get; set; }
    public Subject Subject { get; set; } = default!;

    // Immutable Commercial Terms Snapshot (INV-AGREE-007, INV-AGREE-008)
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal TotalPrice { get; set; }
    public int TotalSessions { get; set; }
    public int SessionDurationMinutes { get; set; }
    public TeachingMode TeachingMode { get; set; }

    // Lifecycle Status
    public CustomAgreementStatus Status { get; set; } = CustomAgreementStatus.Proposed;

    // Offer Expiration (DEC-AGREE-001)
    public DateTime ExpiresAt { get; set; }

    // Audit Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? AcceptedAt { get; private set; }
    public DateTime? RejectedAt { get; private set; }
    public string? RejectionReason { get; private set; }
    public DateTime? CancelledAt { get; private set; }
    public string? CancellationReason { get; private set; }

    // Domain State Machine Methods

    public void CheckAndApplyExpiration()
    {
        if (Status == CustomAgreementStatus.Proposed && DateTime.UtcNow > ExpiresAt)
        {
            Status = CustomAgreementStatus.Expired;
        }
    }

    public void Accept(Guid studentProfileId)
    {
        CheckAndApplyExpiration();

        if (StudentProfileId != studentProfileId)
        {
            throw new InvalidOperationException("Only the designated student participant can accept this custom agreement.");
        }

        if (Status == CustomAgreementStatus.Expired)
        {
            throw new InvalidOperationException("This custom agreement offer has expired.");
        }

        if (Status != CustomAgreementStatus.Proposed)
        {
            throw new InvalidOperationException($"Agreement cannot be accepted from current status '{Status}'.");
        }

        Status = CustomAgreementStatus.Accepted;
        AcceptedAt = DateTime.UtcNow;
    }

    public void Reject(Guid studentProfileId, string reason)
    {
        CheckAndApplyExpiration();

        if (StudentProfileId != studentProfileId)
        {
            throw new InvalidOperationException("Only the designated student participant can reject this custom agreement.");
        }

        if (Status == CustomAgreementStatus.Expired)
        {
            throw new InvalidOperationException("This custom agreement offer has expired.");
        }

        if (Status != CustomAgreementStatus.Proposed)
        {
            throw new InvalidOperationException($"Agreement cannot be rejected from current status '{Status}'.");
        }

        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new ArgumentException("A valid rejection reason is required.", nameof(reason));
        }

        Status = CustomAgreementStatus.Rejected;
        RejectedAt = DateTime.UtcNow;
        var trimmed = reason.Trim();
        RejectionReason = trimmed.Length > 500 ? trimmed[..500] : trimmed;
    }

    public void Cancel(Guid tutorProfileId, string reason)
    {
        CheckAndApplyExpiration();

        if (TutorProfileId != tutorProfileId)
        {
            throw new InvalidOperationException("Only the proposing tutor participant can cancel this custom agreement.");
        }

        if (Status == CustomAgreementStatus.Expired)
        {
            throw new InvalidOperationException("This custom agreement offer has expired.");
        }

        if (Status != CustomAgreementStatus.Proposed)
        {
            throw new InvalidOperationException($"Agreement cannot be cancelled from current status '{Status}'.");
        }

        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new ArgumentException("A valid cancellation reason is required.", nameof(reason));
        }

        Status = CustomAgreementStatus.Cancelled;
        CancelledAt = DateTime.UtcNow;
        var trimmed = reason.Trim();
        CancellationReason = trimmed.Length > 500 ? trimmed[..500] : trimmed;
    }
}
