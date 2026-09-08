using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class Withdrawal
{
    public Guid Id { get; set; }

    public Guid WalletId { get; set; }
    public Wallet Wallet { get; set; } = default!;

    public decimal Amount { get; set; }

    public WithdrawalStatus Status { get; set; } = WithdrawalStatus.Pending;

    // Immutable snapshot of tutor's payout destination (DEC-WD-002)
    public string BankName { get; set; } = string.Empty;
    public string? BankCode { get; set; }
    public string AccountNumber { get; set; } = string.Empty;
    public string AccountHolderName { get; set; } = string.Empty;
    public string? Note { get; set; }

    public DateTime RequestedAt { get; set; }

    public DateTime? ProcessingStartedAt { get; set; }
    public Guid? ProcessingStartedByAdminId { get; set; }
    public User? ProcessingStartedByAdmin { get; set; }

    public DateTime? ProcessedAt { get; set; }
    public Guid? ProcessedByAdminId { get; set; }
    public User? ProcessedByAdmin { get; set; }

    public string? FailureReason { get; set; }

    // Domain State Machine Methods (Strict Linear State Transitions - DEC-WD-003)
    public void MarkProcessing(Guid adminId)
    {
        if (Status != WithdrawalStatus.Pending)
        {
            throw new InvalidOperationException(
                $"Cannot mark withdrawal as Processing from '{Status}' status. Must be in Pending status.");
        }

        Status = WithdrawalStatus.Processing;
        ProcessingStartedAt = DateTime.UtcNow;
        ProcessingStartedByAdminId = adminId;
    }

    public void Complete(Guid adminId)
    {
        if (Status != WithdrawalStatus.Processing)
        {
            throw new InvalidOperationException(
                $"Cannot complete withdrawal from '{Status}' status. Must be in Processing status.");
        }

        Status = WithdrawalStatus.Completed;
        ProcessedAt = DateTime.UtcNow;
        ProcessedByAdminId = adminId;
    }

    public void Fail(string reason, Guid adminId)
    {
        if (Status != WithdrawalStatus.Processing)
        {
            throw new InvalidOperationException(
                $"Cannot fail withdrawal from '{Status}' status. Must be in Processing status.");
        }

        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new ArgumentException("Failure reason is mandatory.", nameof(reason));
        }

        Status = WithdrawalStatus.Failed;
        FailureReason = reason.Trim();
        ProcessedAt = DateTime.UtcNow;
        ProcessedByAdminId = adminId;
    }
}