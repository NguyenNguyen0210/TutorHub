using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Wallets.GetWalletStatement;

public record GetWalletStatementQuery(
    Guid UserId,
    int PageNumber = 1,
    int PageSize = 20
) : IRequest<PagedResult<WalletTransactionDto>>;

public class GetWalletStatementQueryHandler : IRequestHandler<GetWalletStatementQuery, PagedResult<WalletTransactionDto>>
{
    private readonly IAppDbContext _context;

    public GetWalletStatementQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<WalletTransactionDto>> Handle(GetWalletStatementQuery request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.UserId == request.UserId, cancellationToken);

        if (tutor == null)
        {
            throw new ForbiddenException("Only registered tutors can access their wallet statement.");
        }

        var wallet = await _context.Wallets
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.TutorProfileId == tutor.Id, cancellationToken);

        if (wallet == null)
        {
            return new PagedResult<WalletTransactionDto>(
                new List<WalletTransactionDto>(),
                0,
                request.PageNumber,
                request.PageSize
            );
        }

        var query = _context.WalletTransactions
            .AsNoTracking()
            .Where(wt => wt.WalletId == wallet.Id);

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 20 : (request.PageSize > 100 ? 100 : request.PageSize);

        var items = await query
            .OrderByDescending(wt => wt.CreatedAt)
            .ThenByDescending(wt => wt.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(wt => new WalletTransactionDto(
                wt.Id,
                wt.WalletId,
                wt.WithdrawalId,
                wt.Type,
                wt.Amount,
                wt.BalanceAfter,
                wt.Description,
                wt.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<WalletTransactionDto>(
            items,
            totalCount,
            pageNumber,
            pageSize
        );
    }
}
