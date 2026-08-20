using MediatR;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Wallets.CreateWithdrawal;

public record CreateWithdrawalCommand(
    Guid UserId,
    decimal Amount,
    string BankName,
    string AccountNumber,
    string AccountHolderName,
    string? Note = null
) : IRequest<WithdrawalDto>;
