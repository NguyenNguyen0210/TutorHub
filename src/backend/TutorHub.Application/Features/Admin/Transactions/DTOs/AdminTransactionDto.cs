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
    decimal CommissionRate,
    decimal CommissionAmount,
    decimal PayoutAmount,
    string? PaymentGatewayRef,
    TransactionStatus Status,
    DateTime CreatedAt,
    DateTime? ReleasedAt,
    DateTime? RefundedAt
);
