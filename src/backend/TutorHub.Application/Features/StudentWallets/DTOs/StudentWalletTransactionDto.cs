using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.StudentWallets.DTOs;

public class StudentWalletTransactionDto
{
    public Guid Id { get; set; }
    public Guid StudentWalletId { get; set; }
    public StudentWalletTransactionType Type { get; set; }
    public FinancialDirection Direction { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceBefore { get; set; }
    public decimal BalanceAfter { get; set; }
    public string ReferenceType { get; set; } = default!;
    public Guid? ReferenceId { get; set; }
    public string? Description { get; set; }
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; }
}
