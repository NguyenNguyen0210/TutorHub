using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.StudentWallets.DTOs;

namespace TutorHub.Application.Features.StudentWallets.Queries.GetMyStudentTransactions;

public class GetMyStudentTransactionsQueryHandler
    : IRequestHandler<GetMyStudentTransactionsQuery, PagedResult<StudentWalletTransactionDto>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyStudentTransactionsQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<StudentWalletTransactionDto>> Handle(
        GetMyStudentTransactionsQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var student = await _context.StudentProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        if (student == null)
        {
            throw new ForbiddenException("Only registered students can access their wallet transactions.");
        }

        var wallet = await _context.StudentWallets
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.StudentProfileId == student.Id, cancellationToken);

        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 20 : (request.PageSize > 100 ? 100 : request.PageSize);

        if (wallet == null)
        {
            return new PagedResult<StudentWalletTransactionDto>(
                new List<StudentWalletTransactionDto>(),
                0,
                pageNumber,
                pageSize
            );
        }

        var query = _context.StudentWalletTransactions
            .AsNoTracking()
            .Where(t => t.StudentWalletId == wallet.Id);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .ThenByDescending(t => t.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new StudentWalletTransactionDto
            {
                Id = t.Id,
                StudentWalletId = t.StudentWalletId,
                Type = t.Type,
                Direction = t.Direction,
                Amount = t.Amount,
                BalanceBefore = t.BalanceBefore,
                BalanceAfter = t.BalanceAfter,
                ReferenceType = t.ReferenceType,
                ReferenceId = t.ReferenceId,
                Description = t.Description,
                Reason = t.Reason,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<StudentWalletTransactionDto>(
            items,
            totalCount,
            pageNumber,
            pageSize
        );
    }
}
