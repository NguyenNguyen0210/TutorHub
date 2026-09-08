using MediatR;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Admin.Withdrawals.GetAdminWithdrawalById;

public record GetAdminWithdrawalByIdQuery(Guid WithdrawalId) : IRequest<WithdrawalDto>;
