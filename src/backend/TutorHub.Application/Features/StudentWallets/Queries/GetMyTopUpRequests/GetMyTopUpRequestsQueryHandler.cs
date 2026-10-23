using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Settings;
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
    private readonly IOptions<BankTransferOptions>? _bankTransferOptions;

    public GetMyTopUpRequestsQueryHandler(
        IAppDbContext context,
        ICurrentUserService currentUserService,
        IOptions<BankTransferOptions>? bankTransferOptions = null)
    {
        _context = context;
        _currentUserService = currentUserService;
        _bankTransferOptions = bankTransferOptions;
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

        var bankName = _bankTransferOptions?.Value?.BankName ?? "Vietcombank";
        var bankAccountNo = _bankTransferOptions?.Value?.AccountNumber ?? "1029384756";
        var bankAccountName = _bankTransferOptions?.Value?.AccountName ?? "TUTORHUB JSC";

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
