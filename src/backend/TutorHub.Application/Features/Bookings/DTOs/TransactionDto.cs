using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Bookings.DTOs;

public record TransactionDto(
    Guid Id,
    decimal Amount,
    TransactionStatus Status,
    decimal CommissionRate,
    decimal CommissionAmount,
    decimal PayoutAmount,
    DateTime CreatedAt,
    DateTime? ReleasedAt,
    DateTime? RefundedAt
);
