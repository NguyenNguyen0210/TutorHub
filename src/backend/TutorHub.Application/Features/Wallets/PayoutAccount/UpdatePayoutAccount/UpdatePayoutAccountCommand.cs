using MediatR;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Wallets.PayoutAccount.UpdatePayoutAccount;

public record UpdatePayoutAccountCommand(
    Guid UserId,
    string BankName,
    string? BankCode,
    string AccountNumber,
    string AccountHolderName
) : IRequest<TutorPayoutAccountDto>;
