using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.StudentWallets.DTOs;

namespace TutorHub.Application.Features.StudentWallets.Queries.GetMyStudentWithdrawals;

public class GetMyStudentWithdrawalsQueryHandler
    : IRequestHandler<GetMyStudentWithdrawalsQuery, PagedResult<StudentWithdrawalDto>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyStudentWithdrawalsQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<StudentWithdrawalDto>> Handle(
        GetMyStudentWithdrawalsQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var student = await _context.StudentProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        if (student == null)
        {
            throw new ForbiddenException("Only registered students can view their withdrawal requests.");
        }

        var wallet = await _context.StudentWallets
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.StudentProfileId == student.Id, cancellationToken);

        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 20 : (request.PageSize > 100 ? 100 : request.PageSize);

        if (wallet == null)
        {
            return new PagedResult<StudentWithdrawalDto>(
                new List<StudentWithdrawalDto>(),
                0,
                pageNumber,
                pageSize
            );
        }

        var query = _context.StudentWithdrawals
            .AsNoTracking()
            .Where(w => w.StudentWalletId == wallet.Id);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(w => w.RequestedAt)
            .ThenByDescending(w => w.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(w => new StudentWithdrawalDto
            {
                Id = w.Id,
                StudentWalletId = w.StudentWalletId,
                Amount = w.Amount,
                Status = w.Status,
                BankName = w.BankName,
                BankCode = w.BankCode,
                AccountNumber = w.AccountNumber,
                AccountHolderName = w.AccountHolderName,
                Note = w.Note,
                RequestedAt = w.RequestedAt,
                ProcessedAt = w.ProcessedAt,
                FailureReason = w.FailureReason
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<StudentWithdrawalDto>(
            items,
            totalCount,
            pageNumber,
            pageSize
        );
    }
}
