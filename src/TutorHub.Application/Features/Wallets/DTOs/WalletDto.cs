namespace TutorHub.Application.Features.Wallets.DTOs;

public record WalletDto(
    Guid Id,
    Guid TutorProfileId,
    decimal PendingBalance,
    decimal AvailableBalance,
    decimal PendingWithdrawal,
    decimal TotalBalance,
    DateTime UpdatedAt
);
