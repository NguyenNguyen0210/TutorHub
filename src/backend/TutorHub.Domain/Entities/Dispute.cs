using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class Dispute
{
    public Guid Id { get; set; }

    public Guid SessionId { get; set; }
    public Session Session { get; set; } = default!;

    public Guid InitiatorUserId { get; set; }
    public User InitiatorUser { get; set; } = default!;

    public Guid RespondentUserId { get; set; }
    public User RespondentUser { get; set; } = default!;

    public DisputeReason Reason { get; set; }
    public string Description { get; set; } = string.Empty;

    public DisputeStatus Status { get; private set; } = DisputeStatus.Open;
    public DisputeResolutionDecision? ResolutionDecision { get; private set; }
    public string? AdminNotes { get; private set; }
    public Guid? ResolvedByAdminId { get; private set; }
    public string? ResolutionSource { get; private set; }
    public DateTime? ResolvedAt { get; private set; }

    // Financial Hold fields (DEC-S8-001, DEC-S8-022, DEC-S8-028, DEC-S8-034)
    public decimal HeldAmount { get; private set; }
    public FinancialHoldType HoldType { get; private set; } = FinancialHoldType.None;
    public FinancialHoldStatus HoldStatus { get; private set; } = FinancialHoldStatus.None;
    public DateTime? HeldAt { get; private set; }
    public DateTime? HoldReleasedAt { get; private set; }

    // DB single resolution enforcement (DEC-S8-033, INV-DISP-009)
    public Guid? OriginalTransactionId { get; set; }
    public bool AffectsFinancialResolution { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    public ICollection<DisputeEvidence> Evidences { get; set; } = new List<DisputeEvidence>();

    // State machine methods
    public void MoveUnderReview(Guid adminId, DateTime now)
    {
        if (Status != DisputeStatus.Open && Status != DisputeStatus.RequiresAdminFinancialIntervention)
            throw new InvalidOperationException($"Cannot move dispute from {Status} to UnderReview.");

        Status = DisputeStatus.UnderReview;
        UpdatedAt = now;
    }

    public void SetFinancialHold(decimal amount, FinancialHoldType holdType, FinancialHoldStatus holdStatus, DateTime now)
    {
        HeldAmount = amount;
        HoldType = holdType;
        HoldStatus = holdStatus;
        HeldAt = now;
        UpdatedAt = now;
    }

    public void ReleaseFinancialHold(Guid adminId, DateTime now, FinancialHoldStatus targetStatus = FinancialHoldStatus.Released)
    {
        HoldStatus = targetStatus;
        HoldReleasedAt = now;
        UpdatedAt = now;
    }

    public void MarkRequiresAdminFinancialIntervention(string reason)
    {
        Status = DisputeStatus.RequiresAdminFinancialIntervention;
        AdminNotes = string.IsNullOrWhiteSpace(AdminNotes) ? reason : $"{AdminNotes}; {reason}";
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkRequiresAdminRefundSettlement(string reason)
    {
        Status = DisputeStatus.RequiresAdminRefundSettlement;
        AdminNotes = string.IsNullOrWhiteSpace(AdminNotes) ? reason : $"{AdminNotes}; {reason}";
        UpdatedAt = DateTime.UtcNow;
    }

    public void ResolveByAdmin(
        Guid adminId,
        DisputeResolutionDecision decision,
        string adminNotes,
        DateTime now,
        Guid? originalTransactionId = null,
        bool affectsFinancial = true)
    {
        if (Status != DisputeStatus.UnderReview && Status != DisputeStatus.Open && Status != DisputeStatus.RequiresAdminFinancialIntervention)
            throw new InvalidOperationException($"Cannot resolve dispute in status '{Status}'.");

        Status = DisputeStatus.Resolved;
        ResolutionDecision = decision;
        AdminNotes = adminNotes;
        ResolvedByAdminId = adminId;
        ResolutionSource = "DisputeAdminResolution";
        ResolvedAt = now;
        UpdatedAt = now;

        if (affectsFinancial && decision != DisputeResolutionDecision.DismissedNoFinancialChange)
        {
            AffectsFinancialResolution = true;
            OriginalTransactionId = originalTransactionId;
        }
    }

    public void DismissByAdmin(Guid adminId, string adminNotes, DateTime now)
    {
        if (Status != DisputeStatus.UnderReview && Status != DisputeStatus.Open && Status != DisputeStatus.RequiresAdminFinancialIntervention)
            throw new InvalidOperationException($"Cannot dismiss dispute in status '{Status}'.");

        Status = DisputeStatus.Dismissed;
        ResolutionDecision = DisputeResolutionDecision.DismissedNoFinancialChange;
        AdminNotes = adminNotes;
        ResolvedByAdminId = adminId;
        ResolutionSource = "DisputeAdminDismissal";
        ResolvedAt = now;
        UpdatedAt = now;
    }
}
