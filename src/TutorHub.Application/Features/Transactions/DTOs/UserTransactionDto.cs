using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Transactions.DTOs;

public record UserTransactionDto(
    Guid Id,
    Guid BookingId,
    string SubjectName,
    string OtherPartyName,
    decimal GrossAmount,
    decimal? CommissionAmount,
    decimal? PayoutAmount,
    TransactionStatus Status,
    string? PaymentGatewayRef,
    DateTime CreatedAt,
    DateTime? ReleasedAt,
    DateTime? RefundedAt
);
