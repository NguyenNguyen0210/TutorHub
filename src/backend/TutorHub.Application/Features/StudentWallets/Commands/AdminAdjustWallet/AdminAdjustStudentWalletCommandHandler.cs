using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.StudentWallets.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using System.Text.Json;

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
                .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"Id\" = {request.StudentWalletId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            if (wallet == null)
            {
                throw new NotFoundException(nameof(StudentWallet), request.StudentWalletId);
            }

            var balanceBefore = wallet.AvailableBalance;
            var isStudentWallet = await _context.StudentProfiles.AnyAsync(s => s.Id == wallet.StudentProfileId
                && s.User.Role == UserRole.Student, cancellationToken);
            if (!isStudentWallet) throw new BadRequestException("Ví này không thuộc học viên.");
            if (request.ExpectedAvailableBalance.HasValue && request.ExpectedAvailableBalance != balanceBefore)
                throw new ConflictException("Số dư đã thay đổi. Vui lòng kiểm tra lại ví trước khi xác nhận.");

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
            _context.AuditLogs.Add(new AuditLog
            {
                Id = Guid.NewGuid(), UserId = adminId, Action = "STUDENT_WALLET_ADJUSTED", EntityName = "Wallet",
                EntityId = wallet.Id.ToString(), CorrelationId = ledger.Id.ToString(), CreatedAt = now,
                OldValuesJson = JsonSerializer.Serialize(new { AvailableBalance = balanceBefore }),
                NewValuesJson = JsonSerializer.Serialize(new { AvailableBalance = balanceAfter, request.Amount, request.Direction, request.Reason, request.ReferenceId, LedgerId = ledger.Id })
            });

            await _context.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return new StudentWalletDto
            {
                Id = wallet.Id,
                StudentProfileId = wallet.StudentProfileId,
                AvailableBalance = wallet.AvailableBalance,
                WithdrawingBalance = wallet.WithdrawingBalance,
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
