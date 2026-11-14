using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Transactions.DTOs;

public record UserTransactionDto(
    Guid Id,
    Guid BookingId,
    string SubjectName,
    string OtherPartyName,
    decimal GrossAmount,
    decimal? PlatformFeeAmount,
    decimal? PayoutAmount,
    TransactionStatus Status,
    string? PaymentGatewayRef,
    DateTime CreatedAt,
    DateTime? ReleasedAt,
    DateTime? RefundedAt
)
{
    public TransactionType Type { get; init; }
    public string? ServiceTitle { get; init; }
    public BookingStatus BookingStatus { get; init; }
    public Guid? EnrollmentId { get; init; }
    public string? PaymentSource { get; init; }
    public decimal? CommissionAmount => PlatformFeeAmount;
}
