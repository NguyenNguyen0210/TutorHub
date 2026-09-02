namespace TutorHub.Application.Features.Wallets.DTOs;

public record UpdatePayoutAccountRequest(
    string BankName,
    string? BankCode,
    string AccountNumber,
    string AccountHolderName
);
