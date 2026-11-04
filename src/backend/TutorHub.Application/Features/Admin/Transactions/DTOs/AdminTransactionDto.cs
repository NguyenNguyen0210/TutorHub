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
    DateTime? RefundedAt,
    TransactionType Type = TransactionType.BookingPayment,
    Guid? SessionId = null,
    Guid? DisputeId = null,
    Guid? EnrollmentId = null,
    string? ServiceTitle = null,
    int? SessionNumber = null,
    DateTime? BookingConfirmedAt = null,
    Guid? RelatedTransactionId = null,
    string? Description = null,
    bool SettlementRequired = false
)
{
    public decimal CommissionRate => PlatformFeeRate;
    public decimal CommissionAmount => PlatformFeeAmount;
}
