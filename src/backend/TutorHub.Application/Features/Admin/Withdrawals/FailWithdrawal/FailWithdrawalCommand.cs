using MediatR;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Admin.Withdrawals.FailWithdrawal;

public record FailWithdrawalCommand(
    Guid WithdrawalId,
    Guid AdminId,
    string Reason
) : IRequest<WithdrawalDto>;
