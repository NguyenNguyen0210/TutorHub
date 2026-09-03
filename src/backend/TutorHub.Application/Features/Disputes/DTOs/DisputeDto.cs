using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Disputes.DTOs;

public class DisputeDto
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public int SessionNumber { get; set; }
    public Guid EnrollmentId { get; set; }
    public Guid InitiatorUserId { get; set; }
    public string InitiatorName { get; set; } = string.Empty;
    public Guid RespondentUserId { get; set; }
    public string RespondentName { get; set; } = string.Empty;
    public DisputeReason Reason { get; set; }
    public string Description { get; set; } = string.Empty;
    public DisputeStatus Status { get; set; }
    public DisputeResolutionDecision? ResolutionDecision { get; set; }
    public string? AdminNotes { get; set; }
    public Guid? ResolvedByAdminId { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public decimal HeldAmount { get; set; }
    public FinancialHoldType HoldType { get; set; }
    public FinancialHoldStatus HoldStatus { get; set; }
    public DateTime? HeldAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<DisputeEvidenceDto> Evidences { get; set; } = new();
}

public class DisputeEvidenceDto
{
    public Guid Id { get; set; }
    public Guid DisputeId { get; set; }
    public Guid UploadedByUserId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public DateTime CreatedAt { get; set; }
}
