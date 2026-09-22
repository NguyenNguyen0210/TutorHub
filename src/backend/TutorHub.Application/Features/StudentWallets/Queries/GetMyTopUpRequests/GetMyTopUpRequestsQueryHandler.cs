using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.StudentWallets.DTOs;

namespace TutorHub.Application.Features.StudentWallets.Queries.GetMyTopUpRequests;

public class GetMyTopUpRequestsQueryHandler
    : IRequestHandler<GetMyTopUpRequestsQuery, PagedResult<TopUpRequestDto>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyTopUpRequestsQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<TopUpRequestDto>> Handle(
        GetMyTopUpRequestsQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var student = await _context.StudentProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        if (student == null)
        {
            throw new ForbiddenException("Only registered students can view their top-up requests.");
        }

        var wallet = await _context.StudentWallets
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.StudentProfileId == student.Id, cancellationToken);

        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 20 : (request.PageSize > 100 ? 100 : request.PageSize);

        if (wallet == null)
        {
            return new PagedResult<TopUpRequestDto>(
                new List<TopUpRequestDto>(),
                0,
                pageNumber,
                pageSize
            );
        }

        var bankNameSetting = await _context.PlatformSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == "PlatformBankName", cancellationToken);
        var bankAccountNoSetting = await _context.PlatformSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == "PlatformBankAccountNo", cancellationToken);
        var bankAccountNameSetting = await _context.PlatformSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == "PlatformBankAccountName", cancellationToken);

        var bankName = bankNameSetting?.Value ?? "Vietcombank";
        var bankAccountNo = bankAccountNoSetting?.Value ?? "1029384756";
        var bankAccountName = bankAccountNameSetting?.Value ?? "TUTORHUB JSC";

        var query = _context.TopUpRequests
            .AsNoTracking()
            .Where(r => r.StudentWalletId == wallet.Id);

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
                BankName = bankName,
                BankAccountNo = bankAccountNo,
                BankAccountName = bankAccountName
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
