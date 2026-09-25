using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.StudentWallets.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.StudentWallets.Commands.AdminFailWithdrawal;

public class AdminFailStudentWithdrawalCommandHandler : IRequestHandler<AdminFailStudentWithdrawalCommand, StudentWithdrawalDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IClock _clock;

    public AdminFailStudentWithdrawalCommandHandler(IAppDbContext context, ICurrentUserService currentUserService, IClock clock)
    {
        _context = context;
        _currentUserService = currentUserService;
        _clock = clock;
    }

    public async Task<StudentWithdrawalDto> Handle(AdminFailStudentWithdrawalCommand request, CancellationToken cancellationToken)
    {
        var adminId = _currentUserService.UserIdOrThrow();
        var now = _clock.UtcNow;

        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var withdrawal = await _context.StudentWithdrawals
                .Include(w => w.StudentWallet)
                    .ThenInclude(sw => sw.StudentProfile)
                .FirstOrDefaultAsync(w => w.Id == request.WithdrawalId, cancellationToken);

            if (withdrawal == null)
            {
                throw new NotFoundException(nameof(StudentWithdrawal), request.WithdrawalId);
            }

            // Concurrency lock on student wallet
            var wallet = await _context.StudentWallets
                .FromSqlInterpolated($"SELECT * FROM \"StudentWallets\" WHERE \"Id\" = {withdrawal.StudentWalletId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            if (wallet == null)
            {
                throw new NotFoundException(nameof(StudentWallet), withdrawal.StudentWalletId);
            }

            // Transition status to Failed
            withdrawal.Fail(request.Reason, adminId);

            // Release reserved balance back to available balance (Option B)
            var balanceBefore = wallet.AvailableBalance;
            wallet.ReleaseWithdrawalReservation(withdrawal.Amount, now);
            var balanceAfter = wallet.AvailableBalance;

            // Explicit reversal ledger entry (INV-STUDENT-WALLET-003)
            var ledger = new StudentWalletTransaction
            {
                Id = Guid.NewGuid(),
                StudentWalletId = wallet.Id,
                Type = StudentWalletTransactionType.WithdrawalReversalCredit,
                Direction = FinancialDirection.Credit,
                Amount = withdrawal.Amount,
                BalanceBefore = balanceBefore,
                BalanceAfter = balanceAfter,
                ReferenceType = "StudentWithdrawal",
                ReferenceId = withdrawal.Id,
                Description = $"Hoàn lại số dư rút tiền: {request.Reason.Trim()}",
                Reason = request.Reason.Trim(),
                CreatedByUserId = adminId,
                CreatedAt = now
            };

            _context.StudentWalletTransactions.Add(ledger);

            // Emit business event
            _context.AddOutboxMessage(new StudentWithdrawalFailedEvent(
                withdrawal.Id,
                withdrawal.StudentWallet.StudentProfileId,
                withdrawal.StudentWallet.StudentProfile.UserId,
                new MoneyDto(withdrawal.Amount, "VND"),
                request.Reason.Trim(),
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
