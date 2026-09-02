using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wallets.DTOs;

public record WalletTransactionDto(
    Guid Id,
    Guid WalletId,
    Guid? WithdrawalId,
    WalletTransactionType Type,
    decimal Amount,
    decimal BalanceAfter,
    string? Description,
    DateTime CreatedAt
);
