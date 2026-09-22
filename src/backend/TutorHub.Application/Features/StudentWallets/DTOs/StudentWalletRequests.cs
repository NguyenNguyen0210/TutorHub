using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.StudentWallets.DTOs;

public record StudentTopUpApiRequest(decimal Amount);

public record StudentWithdrawalApiRequest(
    decimal Amount,
    string BankName,
    string? BankCode,
    string AccountNumber,
    string AccountHolderName,
    string? Note = null
);

public record AdminConfirmTopUpApiRequest(string? AdminNote = null);

public record AdminRejectTopUpApiRequest(string Reason);

public record AdminFailWithdrawalApiRequest(string Reason);

public record AdminAdjustWalletApiRequest(
    Guid StudentWalletId,
    decimal Amount,
    FinancialDirection Direction,
    string Reason,
    Guid? ReferenceId = null
);
