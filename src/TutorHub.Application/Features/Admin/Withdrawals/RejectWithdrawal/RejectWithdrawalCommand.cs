using MediatR;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Admin.Withdrawals.RejectWithdrawal;

public record RejectWithdrawalCommand(
    Guid WithdrawalId,
    Guid AdminId,
    string Reason
) : IRequest<WithdrawalDto>;
