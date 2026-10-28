using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Withdrawals.CompleteWithdrawal;

public class CompleteWithdrawalCommandHandler : IRequestHandler<CompleteWithdrawalCommand, WithdrawalDto>
{
    private readonly IAppDbContext _context;
    private readonly IAuditLogService _auditLogService;
    private readonly ICurrentUserService _currentUserService;

    public CompleteWithdrawalCommandHandler(
        IAppDbContext context,
        IAuditLogService auditLogService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _auditLogService = auditLogService;
        _currentUserService = currentUserService;
    }

    public async Task<WithdrawalDto> Handle(CompleteWithdrawalCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var pending = await _context.Withdrawals.AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == request.WithdrawalId, cancellationToken);

        if (pending == null)
        {
            throw new NotFoundException("Withdrawal", request.WithdrawalId);
        }

        // Strict State Transition Guard: Must be in Processing status
        if (pending.Status != WithdrawalStatus.Processing)
        {
            throw new ConflictException(
                $"Cannot complete withdrawal in '{pending.Status}' status. Must be in Processing status.");
        }

        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (admin == null)
        {
            throw new UnauthorizedException("Admin user not found.");
        }

        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);
        await _context.Database.ExecuteSqlInterpolatedAsync(
            $"SELECT 1 FROM \"Withdrawals\" WHERE \"Id\" = {request.WithdrawalId} FOR UPDATE",
            cancellationToken);

        var withdrawal = await _context.Withdrawals
            .Include(w => w.ProcessingStartedByAdmin)
            .FirstAsync(w => w.Id == request.WithdrawalId, cancellationToken);
        if (withdrawal.Status != WithdrawalStatus.Processing)
            throw new ConflictException($"Cannot complete withdrawal in '{withdrawal.Status}' status.");

        var wallet = await _context.Wallets
            .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"Id\" = {withdrawal.WalletId} FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Wallet", withdrawal.WalletId);
        var now = DateTime.UtcNow;
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
            CreatedByUserId = userId,
            CreatedAt = now
        });

        withdrawal.Wallet = wallet;
        wallet.User = await _context.Users.FirstAsync(u => u.Id == wallet.UserId, cancellationToken);

        // Domain State Transition: Complete
        withdrawal.Complete(userId);
        withdrawal.ProcessedByAdmin = admin;

        await _auditLogService.LogAsync(
            action: "WithdrawalCompleted",
            entityName: "Withdrawal",
            entityId: withdrawal.Id.ToString(),
            userId: userId,
            oldValues: new { Status = WithdrawalStatus.Processing.ToString() },
            newValues: new { Status = withdrawal.Status.ToString() },
            cancellationToken: cancellationToken);

        // Enqueue Outbox Message in same DB transaction
        _context.AddOutboxMessage(new WithdrawalCompletedEvent(
            withdrawal.Id,
            withdrawal.Wallet.TutorProfileId ?? Guid.Empty,
            withdrawal.Wallet.UserId != Guid.Empty ? withdrawal.Wallet.UserId : (withdrawal.Wallet.TutorProfile?.UserId ?? Guid.Empty),
            new MoneyDto(withdrawal.Amount)));

        await _context.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        // outbox-only delivery (OutboxDispatcherJob). No direct publish.

        return new WithdrawalDto(
            Id: withdrawal.Id,
            WalletId: withdrawal.WalletId,
            TutorProfileId: withdrawal.Wallet.TutorProfileId,
            TutorName: withdrawal.Wallet.User?.FullName ?? withdrawal.Wallet.TutorProfile?.User?.FullName ?? string.Empty,
            TutorEmail: withdrawal.Wallet.User?.Email ?? withdrawal.Wallet.TutorProfile?.User?.Email ?? string.Empty,
            Amount: withdrawal.Amount,
            Status: withdrawal.Status,
            BankName: withdrawal.BankName,
            BankCode: withdrawal.BankCode,
            AccountNumber: withdrawal.AccountNumber,
            AccountHolderName: withdrawal.AccountHolderName,
            Note: withdrawal.Note,
            RequestedAt: withdrawal.RequestedAt,
            ProcessingStartedAt: withdrawal.ProcessingStartedAt,
            ProcessingStartedByAdminId: withdrawal.ProcessingStartedByAdminId,
            ProcessingStartedByAdminName: withdrawal.ProcessingStartedByAdmin?.FullName,
            ProcessedAt: withdrawal.ProcessedAt,
            ProcessedByAdminId: withdrawal.ProcessedByAdminId,
            ProcessedByAdminName: admin.FullName,
            FailureReason: withdrawal.FailureReason
        );
    }
}
