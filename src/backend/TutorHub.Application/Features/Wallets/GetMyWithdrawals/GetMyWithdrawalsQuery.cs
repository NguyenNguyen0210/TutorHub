using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Wallets.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wallets.GetMyWithdrawals;

public record GetMyWithdrawalsQuery(
    Guid UserId,
    WithdrawalStatus? Status = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PagedResult<WithdrawalDto>>;
