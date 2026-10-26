using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.StudentWallets.DTOs;

namespace TutorHub.Application.Features.StudentWallets.Queries.AdminGetTopUpRequests;

public class AdminGetTopUpRequestsQueryHandler
    : IRequestHandler<AdminGetTopUpRequestsQuery, PagedResult<TopUpRequestDto>>
{
    private readonly IAppDbContext _context;

    public AdminGetTopUpRequestsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<TopUpRequestDto>> Handle(
        AdminGetTopUpRequestsQuery request,
        CancellationToken cancellationToken)
    {
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 20 : (request.PageSize > 100 ? 100 : request.PageSize);

        var query = _context.TopUpRequests
            .AsNoTracking()
            .Include(r => r.Wallet)
                .ThenInclude(w => w.User)
            .AsQueryable();

        if (request.Status.HasValue)
        {
            query = query.Where(r => r.Status == request.Status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(r => r.RequestedAt)
            .ThenByDescending(r => r.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new TopUpRequestDto
            {
                Id = r.Id,
                StudentWalletId = r.StudentWalletId,
                Amount = r.Amount,
                TransferReference = r.TransferReference,
                Status = r.Status,
                RequestedAt = r.RequestedAt,
                ProcessedAt = r.ProcessedAt,
                RejectionReason = r.RejectionReason,
                AdminNote = r.AdminNote,
                StudentName = r.Wallet.User != null ? r.Wallet.User.FullName : (r.Wallet.StudentProfile != null && r.Wallet.StudentProfile.User != null ? r.Wallet.StudentProfile.User.FullName : null),
                StudentEmail = r.Wallet.User != null ? r.Wallet.User.Email : (r.Wallet.StudentProfile != null && r.Wallet.StudentProfile.User != null ? r.Wallet.StudentProfile.User.Email : null)
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<TopUpRequestDto>(
            items,
            totalCount,
            pageNumber,
            pageSize
        );
    }
}
