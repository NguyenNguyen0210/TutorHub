using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class Withdrawal
{
    public Guid Id { get; set; }

    public Guid WalletId { get; set; }
    public Wallet Wallet { get; set; } = default!;

    public decimal Amount { get; set; }

    public WithdrawalStatus Status { get; set; }

    public DateTime RequestedAt { get; set; }

    public DateTime? ProcessedAt { get; set; }

    public Guid? ProcessedByAdminId { get; set; }
    public User? ProcessedByAdmin { get; set; }

    public string? RejectionReason { get; set; }
}