using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Wallets.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Withdrawals.GetAdminWithdrawals;

public class GetAdminWithdrawalsQueryHandler : IRequestHandler<GetAdminWithdrawalsQuery, PagedResult<WithdrawalDto>>
{
    private readonly IAppDbContext _context;

    public GetAdminWithdrawalsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<WithdrawalDto>> Handle(GetAdminWithdrawalsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Withdrawals
            .AsNoTracking()
            .Include(w => w.Wallet).ThenInclude(wall => wall.TutorProfile).ThenInclude(tp => tp.User)
            .Include(w => w.ProcessingStartedByAdmin)
            .Include(w => w.ProcessedByAdmin)
            .AsQueryable();

        if (request.Status.HasValue)
        {
            query = query.Where(w => w.Status == request.Status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : (request.PageSize > 50 ? 50 : request.PageSize);

        var items = await query
            .OrderByDescending(w => w.RequestedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(w => new WithdrawalDto(
                w.Id,
                w.WalletId,
                w.Wallet.TutorProfileId,
                w.Wallet.TutorProfile.User.FullName,
                w.Wallet.TutorProfile.User.Email,
                w.Amount,
                w.Status,
                w.BankName,
                w.BankCode,
                w.AccountNumber,
                w.AccountHolderName,
                w.Note,
                w.RequestedAt,
                w.ProcessingStartedAt,
                w.ProcessingStartedByAdminId,
                w.ProcessingStartedByAdmin != null ? w.ProcessingStartedByAdmin.FullName : null,
                w.ProcessedAt,
                w.ProcessedByAdminId,
                w.ProcessedByAdmin != null ? w.ProcessedByAdmin.FullName : null,
                w.FailureReason
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<WithdrawalDto>(
            items,
            totalCount,
            pageNumber,
            pageSize
        );
    }
}
