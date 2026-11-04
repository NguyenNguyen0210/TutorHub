using MediatR;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Admin.Withdrawals.CompleteWithdrawal;

public record CompleteWithdrawalCommand(Guid WithdrawalId, string? BankTransferReference = null, string? ReconciliationNote = null) : IRequest<WithdrawalDto>;

public record CompleteWithdrawalApiRequest(string BankTransferReference, string? ReconciliationNote = null);
