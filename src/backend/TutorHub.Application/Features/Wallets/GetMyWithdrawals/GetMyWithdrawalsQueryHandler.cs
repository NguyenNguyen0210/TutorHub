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
    private readonly ICurrentUserService _currentUserService;

    public GetMyWithdrawalsQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<WithdrawalDto>> Handle(GetMyWithdrawalsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            throw new UnauthorizedException("User not found.");
        }

        var tutor = await _context.TutorProfiles
            .FirstOrDefaultAsync(t => t.UserId == userId, cancellationToken);

        var student = await _context.StudentProfiles
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        var tutorId = tutor?.Id ?? Guid.Empty;
        var studentId = student?.Id ?? Guid.Empty;

        var query = _context.Withdrawals
            .AsNoTracking()
            .Include(w => w.Wallet).ThenInclude(wall => wall.User)
            .Include(w => w.ProcessingStartedByAdmin)
            .Include(w => w.ProcessedByAdmin)
            .Where(w => w.Wallet.UserId == userId ||
                        (w.Wallet.TutorProfileId != null && w.Wallet.TutorProfileId == tutorId) ||
                        (w.Wallet.StudentProfileId != null && w.Wallet.StudentProfileId == studentId))
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
            .ThenByDescending(w => w.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(w => new WithdrawalDto(
                w.Id,
                w.WalletId,
                w.Wallet.TutorProfileId,
                w.Wallet.User != null ? w.Wallet.User.FullName : (w.Wallet.TutorProfile != null && w.Wallet.TutorProfile.User != null ? w.Wallet.TutorProfile.User.FullName : string.Empty),
                w.Wallet.User != null ? w.Wallet.User.Email : (w.Wallet.TutorProfile != null && w.Wallet.TutorProfile.User != null ? w.Wallet.TutorProfile.User.Email : string.Empty),
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
            )
            {
                UserId = w.Wallet.UserId,
                StudentProfileId = w.Wallet.StudentProfileId
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<WithdrawalDto>(
            items,
            totalCount,
            pageNumber,
            pageSize
        );
    }
}