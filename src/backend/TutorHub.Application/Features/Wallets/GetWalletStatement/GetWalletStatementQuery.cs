using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Wallets.GetWalletStatement;

public record GetWalletStatementQuery(
    int PageNumber = 1,
    int PageSize = 20
) : IRequest<PagedResult<WalletTransactionDto>>;
