using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.StudentWallets.DTOs;

public class StudentWithdrawalDto
{
    public Guid Id { get; set; }
    public Guid StudentWalletId { get; set; }
    public decimal Amount { get; set; }
    public WithdrawalStatus Status { get; set; }
    public string BankName { get; set; } = default!;
    public string? BankCode { get; set; }
    public string AccountNumber { get; set; } = default!;
    public string AccountHolderName { get; set; } = default!;
    public string? Note { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public string? FailureReason { get; set; }
    public string? StudentName { get; set; }
    public string? StudentEmail { get; set; }
}
