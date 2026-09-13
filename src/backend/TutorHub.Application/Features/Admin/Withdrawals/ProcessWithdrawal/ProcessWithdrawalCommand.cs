using MediatR;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Admin.Withdrawals.ProcessWithdrawal;

public record ProcessWithdrawalCommand(Guid WithdrawalId) : IRequest<WithdrawalDto>;
