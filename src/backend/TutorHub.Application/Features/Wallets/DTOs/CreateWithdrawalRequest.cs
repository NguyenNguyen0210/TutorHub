namespace TutorHub.Application.Features.Wallets.DTOs;

public record CreateWithdrawalRequest(
    decimal Amount,
    string BankName,
    string AccountNumber,
    string AccountHolderName,
    string? Note = null
);
