using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.StudentWallets.Services;

public class StudentWalletService : IStudentWalletService
{
    private readonly IAppDbContext _context;

    public StudentWalletService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<StudentWallet> GetOrCreateWalletAsync(Guid studentProfileId, DateTime now, CancellationToken cancellationToken = default)
    {
        var wallet = await _context.StudentWallets
            .FirstOrDefaultAsync(w => w.StudentProfileId == studentProfileId, cancellationToken);

        if (wallet == null)
        {
            wallet = new StudentWallet
            {
                Id = Guid.NewGuid(),
                StudentProfileId = studentProfileId,
                AvailableBalance = 0m,
                ReservedBalance = 0m,
                CreatedAt = now,
                UpdatedAt = now
            };
            _context.StudentWallets.Add(wallet);
        }

        return wallet;
    }

    public async Task CreditRefundAsync(
        Guid studentProfileId,
        decimal amount,
        string referenceType,
        Guid? referenceId,
        string description,
        DateTime now,
        CancellationToken cancellationToken = default)
    {
        if (amount <= 0) return;

        // Row-level lock on student wallet (FOR UPDATE)
        var wallet = await _context.StudentWallets
            .FromSqlInterpolated($"SELECT * FROM \"StudentWallets\" WHERE \"StudentProfileId\" = {studentProfileId} FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);

        if (wallet == null)
        {
            wallet = new StudentWallet
            {
                Id = Guid.NewGuid(),
                StudentProfileId = studentProfileId,
                AvailableBalance = 0m,
                ReservedBalance = 0m,
                CreatedAt = now,
                UpdatedAt = now
            };
            _context.StudentWallets.Add(wallet);
        }

        var balanceBefore = wallet.AvailableBalance;
        wallet.Credit(amount, now);
        var balanceAfter = wallet.AvailableBalance;

        // Append-only immutable ledger entry (INV-STUDENT-WALLET-003)
        var ledger = new StudentWalletTransaction
        {
            Id = Guid.NewGuid(),
            StudentWalletId = wallet.Id,
            Type = StudentWalletTransactionType.RefundCredit,
            Direction = FinancialDirection.Credit,
            Amount = amount,
            BalanceBefore = balanceBefore,
            BalanceAfter = balanceAfter,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            Description = description,
            CreatedAt = now
        };

        _context.StudentWalletTransactions.Add(ledger);
    }
}
