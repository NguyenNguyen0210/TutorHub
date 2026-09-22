using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class TopUpRequest
{
    public Guid Id { get; set; }

    public Guid StudentWalletId { get; set; }
    public StudentWallet StudentWallet { get; set; } = default!;

    public decimal Amount { get; set; }
    public string TransferReference { get; set; } = string.Empty;
    public TopUpRequestStatus Status { get; set; } = TopUpRequestStatus.Pending;

    public DateTime RequestedAt { get; set; }

    public DateTime? ProcessedAt { get; set; }
    public Guid? ProcessedByAdminId { get; set; }
    public User? ProcessedByAdmin { get; set; }

    public string? RejectionReason { get; set; }
    public string? AdminNote { get; set; }

    public void Confirm(Guid adminId, DateTime now, string? note = null)
    {
        if (Status != TopUpRequestStatus.Pending)
        {
            throw new InvalidOperationException($"Cannot confirm top-up request in '{Status}' status. Must be Pending.");
        }

        Status = TopUpRequestStatus.Confirmed;
        ProcessedByAdminId = adminId;
        ProcessedAt = now;
        AdminNote = note;
    }

    public void Reject(Guid adminId, string reason, DateTime now)
    {
        if (Status != TopUpRequestStatus.Pending)
        {
            throw new InvalidOperationException($"Cannot reject top-up request in '{Status}' status. Must be Pending.");
        }

        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new ArgumentException("Rejection reason is required.", nameof(reason));
        }

        Status = TopUpRequestStatus.Rejected;
        ProcessedByAdminId = adminId;
        ProcessedAt = now;
        RejectionReason = reason.Trim();
    }
}
