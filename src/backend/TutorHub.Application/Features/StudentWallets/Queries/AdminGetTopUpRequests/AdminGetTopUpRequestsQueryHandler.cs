using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.StudentWallets.DTOs;
using TutorHub.Application.Common.Search;

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
            .Where(r => r.Wallet.StudentProfile != null && r.Wallet.StudentProfile.User.Role == TutorHub.Domain.Enums.UserRole.Student)
            .Include(r => r.Wallet)
                .ThenInclude(w => w.User)
            .AsQueryable();

        if (request.Status.HasValue)
        {
            query = query.Where(r => r.Status == request.Status.Value);
        }
        if (request.RecordId.HasValue) query = query.Where(r => r.Id == request.RecordId);
        if (request.ReviewableOnly) query = query.Where(r => r.Status == TutorHub.Domain.Enums.TopUpRequestStatus.Pending
            && !r.TransferReference.ToUpper().StartsWith("TOPUP")
            && (r.AdminNote == null || !r.AdminNote.ToUpper().Contains("VNPAY")));
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var pattern = "%" + VietnameseSearch.EscapeLikePattern(VietnameseSearch.NormalizeTerm(request.Search)) + "%";
            query = query.Where(r => EF.Functions.Like(r.TransferReference.ToLower(), pattern, @"\")
                || EF.Functions.Like(VietnameseSearch.UnaccentImmutable(r.Wallet.StudentProfile!.User.FullName)!.ToLower(), pattern, @"\")
                || EF.Functions.Like(VietnameseSearch.UnaccentImmutable(r.Wallet.StudentProfile!.User.Email)!.ToLower(), pattern, @"\"));
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
                StudentWalletId = r.WalletId,
                Amount = r.Amount,
                TransferReference = r.TransferReference,
                Status = r.Status,
                RequestedAt = r.RequestedAt,
                ProcessedAt = r.ProcessedAt,
                RejectionReason = r.RejectionReason,
                AdminNote = r.AdminNote,
                CanManuallyReview = r.Status == TutorHub.Domain.Enums.TopUpRequestStatus.Pending
                    && !r.TransferReference.ToUpper().StartsWith("TOPUP")
                    && (r.AdminNote == null || !r.AdminNote.ToUpper().Contains("VNPAY")),
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
