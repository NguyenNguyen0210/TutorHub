using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Transactions.DTOs;

public record AdminTransactionDto(
    Guid Id,
    Guid BookingId,
    Guid StudentUserId,
    string StudentName,
    string StudentEmail,
    Guid TutorUserId,
    string TutorName,
    string TutorEmail,
    string SubjectName,
    decimal GrossAmount,
    decimal PlatformFeeRate,
    decimal PlatformFeeAmount,
    decimal PayoutAmount,
    string? PaymentGatewayRef,
    TransactionStatus Status,
    DateTime CreatedAt,
    DateTime? ReleasedAt,
    DateTime? RefundedAt
)
{
    public decimal CommissionRate => PlatformFeeRate;
    public decimal CommissionAmount => PlatformFeeAmount;
}
