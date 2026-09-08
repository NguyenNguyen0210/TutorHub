namespace TutorHub.Application.Features.Wallets.DTOs;

public record TutorPayoutAccountDto(
    string? BankName,
    string? BankCode,
    string? AccountNumber,
    string? AccountHolderName
);
