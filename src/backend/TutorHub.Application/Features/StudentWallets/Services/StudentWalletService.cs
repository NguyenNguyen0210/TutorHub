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

    public async Task<Wallet> GetOrCreateWalletAsync(Guid studentProfileId, DateTime now, CancellationToken cancellationToken = default)
    {
        var wallet = await _context.Wallets
            .FirstOrDefaultAsync(w => w.StudentProfileId == studentProfileId, cancellationToken);

        if (wallet == null)
        {
            var studentProfile = await _context.StudentProfiles
                .FirstOrDefaultAsync(s => s.Id == studentProfileId, cancellationToken);
            var userId = studentProfile?.UserId ?? Guid.Empty;

            if (userId != Guid.Empty)
            {
                wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId, cancellationToken);
            }

            if (wallet == null)
            {
                wallet = new Wallet
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    StudentProfileId = studentProfileId,
                    AvailableBalance = 0m,
                    WithdrawingBalance = 0m,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                _context.Wallets.Add(wallet);
            }
            else
            {
                wallet.StudentProfileId = studentProfileId;
            }
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

        // Row-level lock on wallet (FOR UPDATE)
        var wallet = await _context.Wallets
            .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"StudentProfileId\" = {studentProfileId} OR \"UserId\" = (SELECT \"UserId\" FROM \"StudentProfiles\" WHERE \"Id\" = {studentProfileId}) FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);

        if (wallet == null)
        {
            var studentProfile = await _context.StudentProfiles
                .FirstOrDefaultAsync(s => s.Id == studentProfileId, cancellationToken);
            var userId = studentProfile?.UserId ?? Guid.Empty;

            wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                StudentProfileId = studentProfileId,
                AvailableBalance = 0m,
                WithdrawingBalance = 0m,
                CreatedAt = now,
                UpdatedAt = now
            };
            _context.Wallets.Add(wallet);
        }

        var balanceBefore = wallet.AvailableBalance;
        wallet.CreditAvailable(amount, now);
        var balanceAfter = wallet.AvailableBalance;

        // Append-only immutable ledger entry
        var ledger = new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = wallet.Id,
            Type = WalletTransactionType.RefundCredit,
            Direction = FinancialDirection.Credit,
            Amount = amount,
            BalanceBefore = balanceBefore,
            BalanceAfter = balanceAfter,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            Description = description,
            CreatedAt = now
        };

        _context.WalletTransactions.Add(ledger);
    }
}
