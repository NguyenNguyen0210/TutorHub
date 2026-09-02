using MediatR;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Wallets.CreateWithdrawal;

public record CreateWithdrawalCommand(
    Guid UserId,
    decimal Amount,
    string? BankName = null,
    string? BankCode = null,
    string? AccountNumber = null,
    string? AccountHolderName = null,
    string? Note = null
) : IRequest<WithdrawalDto>;
