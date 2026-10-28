using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.StudentWallets.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.StudentWallets.Commands.AdminCompleteWithdrawal;

public class AdminCompleteStudentWithdrawalCommandHandler : IRequestHandler<AdminCompleteStudentWithdrawalCommand, StudentWithdrawalDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IClock _clock;

    public AdminCompleteStudentWithdrawalCommandHandler(IAppDbContext context, ICurrentUserService currentUserService, IClock clock)
    {
        _context = context;
        _currentUserService = currentUserService;
        _clock = clock;
    }

    public async Task<StudentWithdrawalDto> Handle(AdminCompleteStudentWithdrawalCommand request, CancellationToken cancellationToken)
    {
        var adminId = _currentUserService.UserIdOrThrow();
        var now = _clock.UtcNow;

        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var withdrawal = await _context.StudentWithdrawals
                .FromSqlInterpolated($"SELECT * FROM \"Withdrawals\" WHERE \"Id\" = {request.WithdrawalId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            if (withdrawal == null)
            {
                throw new NotFoundException(nameof(StudentWithdrawal), request.WithdrawalId);
            }

            // Concurrency lock on student wallet
            var wallet = await _context.StudentWallets
                .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"Id\" = {withdrawal.WalletId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            if (wallet == null)
            {
                throw new NotFoundException(nameof(StudentWallet), withdrawal.StudentWalletId);
            }
            if (!wallet.StudentProfileId.HasValue)
                throw new ConflictException("This withdrawal does not belong to a student wallet.");
            withdrawal.Wallet = wallet;

            withdrawal.Complete(adminId);
            var withdrawingBefore = wallet.WithdrawingBalance;
            wallet.CompleteWithdrawal(withdrawal.Amount, now);
            _context.WalletTransactions.Add(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                WithdrawalId = withdrawal.Id,
                Type = WalletTransactionType.WithdrawalSuccessSettlement,
                Direction = FinancialDirection.Debit,
                Amount = withdrawal.Amount,
                BalanceBefore = withdrawingBefore,
                BalanceAfter = wallet.WithdrawingBalance,
                ReferenceType = "Withdrawal",
                ReferenceId = withdrawal.Id,
                Description = $"Completed withdrawal #{withdrawal.Id}",
                CreatedByUserId = adminId,
                CreatedAt = now
            });

            // Emit business event
            _context.AddOutboxMessage(new StudentWithdrawalCompletedEvent(
                withdrawal.Id,
                withdrawal.Wallet.StudentProfileId ?? Guid.Empty,
                withdrawal.Wallet.UserId != Guid.Empty ? withdrawal.Wallet.UserId : (withdrawal.Wallet.StudentProfile?.UserId ?? Guid.Empty),
                new MoneyDto(withdrawal.Amount, "VND"),
                adminId,
                Guid.NewGuid(),
                1,
                now
            ));

            await _context.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return new StudentWithdrawalDto
            {
                Id = withdrawal.Id,
                StudentWalletId = withdrawal.StudentWalletId,
                Amount = withdrawal.Amount,
                Status = withdrawal.Status,
                BankName = withdrawal.BankName,
                BankCode = withdrawal.BankCode,
                AccountNumber = withdrawal.AccountNumber,
                AccountHolderName = withdrawal.AccountHolderName,
                Note = withdrawal.Note,
                RequestedAt = withdrawal.RequestedAt,
                ProcessedAt = withdrawal.ProcessedAt,
                FailureReason = withdrawal.FailureReason
            };
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
