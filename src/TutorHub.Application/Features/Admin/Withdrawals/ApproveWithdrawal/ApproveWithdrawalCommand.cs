using MediatR;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Admin.Withdrawals.ApproveWithdrawal;

public record ApproveWithdrawalCommand(
    Guid WithdrawalId,
    Guid AdminId
) : IRequest<WithdrawalDto>;
