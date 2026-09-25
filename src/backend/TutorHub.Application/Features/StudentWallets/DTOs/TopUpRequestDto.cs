using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.StudentWallets.DTOs;

public class TopUpRequestDto
{
    public Guid Id { get; set; }
    public Guid StudentWalletId { get; set; }
    public decimal Amount { get; set; }
    public string TransferReference { get; set; } = default!;
    public TopUpRequestStatus Status { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public string? RejectionReason { get; set; }
    public string? AdminNote { get; set; }

    // Platform payment info for easy display
    public string? BankName { get; set; }
    public string? BankAccountNo { get; set; }
    public string? BankAccountName { get; set; }
    // Student details for admin views
    public string? StudentName { get; set; }
    public string? StudentEmail { get; set; }
}

