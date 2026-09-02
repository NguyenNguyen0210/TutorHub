namespace TutorHub.Application.Features.Wallets.DTOs;

public record CreateWithdrawalRequest(
    decimal Amount,
    string? BankName = null,
    string? BankCode = null,
    string? AccountNumber = null,
    string? AccountHolderName = null,
    string? Note = null
);
