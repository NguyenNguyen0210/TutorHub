using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.StudentWallets.DTOs;

namespace TutorHub.Application.Features.StudentWallets.Queries.AdminGetStudentWithdrawals;

public class AdminGetStudentWithdrawalsQueryHandler
    : IRequestHandler<AdminGetStudentWithdrawalsQuery, PagedResult<StudentWithdrawalDto>>
{
    private readonly IAppDbContext _context;

    public AdminGetStudentWithdrawalsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<StudentWithdrawalDto>> Handle(
        AdminGetStudentWithdrawalsQuery request,
        CancellationToken cancellationToken)
    {
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 20 : (request.PageSize > 100 ? 100 : request.PageSize);

        var query = _context.StudentWithdrawals
            .AsNoTracking()
            .Include(w => w.StudentWallet)
                .ThenInclude(sw => sw.StudentProfile)
                    .ThenInclude(p => p.User)
            .AsQueryable();

        if (request.Status.HasValue)
        {
            query = query.Where(w => w.Status == request.Status.Value);
        }

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
                FailureReason = w.FailureReason,
                StudentName = w.StudentWallet.StudentProfile.User.FullName,
                StudentEmail = w.StudentWallet.StudentProfile.User.Email
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
