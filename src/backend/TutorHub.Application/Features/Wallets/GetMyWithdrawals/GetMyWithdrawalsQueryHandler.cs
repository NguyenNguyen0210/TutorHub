using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Wallets.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wallets.GetMyWithdrawals;

public class GetMyWithdrawalsQueryHandler : IRequestHandler<GetMyWithdrawalsQuery, PagedResult<WithdrawalDto>>
{
    private readonly IAppDbContext _context;

    public GetMyWithdrawalsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<WithdrawalDto>> Handle(GetMyWithdrawalsQuery request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .FirstOrDefaultAsync(t => t.UserId == request.UserId, cancellationToken);

        if (tutor == null)
        {
            throw new ForbiddenException("Only registered tutors can access withdrawal history.");
        }

        var query = _context.Withdrawals
            .AsNoTracking()
            .Include(w => w.Wallet).ThenInclude(wall => wall.TutorProfile).ThenInclude(tp => tp.User)
            .Include(w => w.ProcessedByAdmin)
            .Where(w => w.Wallet.TutorProfileId == tutor.Id)
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
                w.AccountNumber,
                w.AccountHolderName,
                w.Note,
                w.RequestedAt,
                w.ProcessedAt,
                w.ProcessedByAdminId,
                w.ProcessedByAdmin != null ? w.ProcessedByAdmin.FullName : null,
                w.RejectionReason
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
