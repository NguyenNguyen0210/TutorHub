using MediatR;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Admin.Withdrawals.CompleteWithdrawal;

public record CompleteWithdrawalCommand(Guid WithdrawalId, Guid AdminId) : IRequest<WithdrawalDto>;
