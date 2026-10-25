using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Bookings.DTOs;

public record TransactionDto(
    Guid Id,
    decimal Amount,
    TransactionStatus Status,
    decimal PlatformFeeRate,
    decimal PlatformFeeAmount,
    decimal PayoutAmount,
    DateTime CreatedAt,
    DateTime? ReleasedAt,
    DateTime? RefundedAt
)
{
    public decimal CommissionRate => PlatformFeeRate;
    public decimal CommissionAmount => PlatformFeeAmount;
}
