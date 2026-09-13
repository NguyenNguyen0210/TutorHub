using MediatR;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Admin.Withdrawals.FailWithdrawal;

public record FailWithdrawalCommand(
    Guid WithdrawalId,
    string Reason
) : IRequest<WithdrawalDto>;
