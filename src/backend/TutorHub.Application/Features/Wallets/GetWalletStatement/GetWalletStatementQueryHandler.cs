using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Wallets.GetWalletStatement;

public class GetWalletStatementQueryHandler : IRequestHandler<GetWalletStatementQuery, PagedResult<WalletTransactionDto>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetWalletStatementQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<WalletTransactionDto>> Handle(GetWalletStatementQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var tutor = _context.TutorProfiles != null
            ? await _context.TutorProfiles.AsNoTracking().FirstOrDefaultAsync(t => t.UserId == userId, cancellationToken)
            : null;
        var student = _context.StudentProfiles != null
            ? await _context.StudentProfiles.AsNoTracking().FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken)
            : null;

        var tutorId = tutor?.Id;
        var studentId = student?.Id;

        var wallet = await _context.Wallets
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.UserId == userId || (tutorId != null && w.TutorProfileId == tutorId) || (studentId != null && w.StudentProfileId == studentId), cancellationToken);

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
            .Where(t => t.WalletId == wallet.Id);

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 20 : (request.PageSize > 100 ? 100 : request.PageSize);

        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .ThenByDescending(t => t.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new WalletTransactionDto(
                t.Id,
                t.WalletId,
                t.WithdrawalId,
                t.Type,
                t.Amount,
                t.BalanceAfter,
                t.Description,
                t.CreatedAt
            )
            {
                Direction = t.Direction,
                BalanceBefore = t.BalanceBefore,
                ReferenceType = t.ReferenceType,
                ReferenceId = t.ReferenceId
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<WalletTransactionDto>(
            items,
            totalCount,
            pageNumber,
            pageSize
        );
    }
}