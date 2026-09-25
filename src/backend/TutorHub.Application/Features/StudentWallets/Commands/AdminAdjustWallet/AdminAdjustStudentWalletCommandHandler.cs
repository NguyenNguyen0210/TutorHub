using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.StudentWallets.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.StudentWallets.Commands.AdminAdjustWallet;

public class AdminAdjustStudentWalletCommandHandler : IRequestHandler<AdminAdjustStudentWalletCommand, StudentWalletDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IClock _clock;

    public AdminAdjustStudentWalletCommandHandler(IAppDbContext context, ICurrentUserService currentUserService, IClock clock)
    {
        _context = context;
        _currentUserService = currentUserService;
        _clock = clock;
    }

    public async Task<StudentWalletDto> Handle(AdminAdjustStudentWalletCommand request, CancellationToken cancellationToken)
    {
        var adminId = _currentUserService.UserIdOrThrow();
        var now = _clock.UtcNow;

        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            // Row-level lock on student wallet
            var wallet = await _context.StudentWallets
                .FromSqlInterpolated($"SELECT * FROM \"StudentWallets\" WHERE \"Id\" = {request.StudentWalletId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            if (wallet == null)
            {
                throw new NotFoundException(nameof(StudentWallet), request.StudentWalletId);
            }

            var balanceBefore = wallet.AvailableBalance;

            if (request.Direction == FinancialDirection.Credit)
            {
                wallet.Credit(request.Amount, now);
            }
            else
            {
                wallet.Debit(request.Amount, now);
            }

            var balanceAfter = wallet.AvailableBalance;

            var transactionType = request.Direction == FinancialDirection.Credit
                ? StudentWalletTransactionType.AdjustmentCredit
                : StudentWalletTransactionType.AdjustmentDebit;

            var ledger = new StudentWalletTransaction
            {
                Id = Guid.NewGuid(),
                StudentWalletId = wallet.Id,
                Type = transactionType,
                Direction = request.Direction,
                Amount = request.Amount,
                BalanceBefore = balanceBefore,
                BalanceAfter = balanceAfter,
                ReferenceType = "ManualAdjustment",
                ReferenceId = request.ReferenceId,
                Description = $"Admin điều chỉnh số dư: {request.Reason.Trim()}",
                Reason = request.Reason.Trim(),
                CreatedByUserId = adminId,
                CreatedAt = now
            };

            _context.StudentWalletTransactions.Add(ledger);

            await _context.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return new StudentWalletDto
            {
                Id = wallet.Id,
                StudentProfileId = wallet.StudentProfileId,
                AvailableBalance = wallet.AvailableBalance,
                ReservedBalance = wallet.ReservedBalance,
                TotalBalance = wallet.TotalBalance,
                UpdatedAt = wallet.UpdatedAt
            };
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
