using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Withdrawals.FailWithdrawal;

public class FailWithdrawalCommandHandler : IRequestHandler<FailWithdrawalCommand, WithdrawalDto>
{
    private readonly IAppDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public FailWithdrawalCommandHandler(IAppDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    public async Task<WithdrawalDto> Handle(FailWithdrawalCommand request, CancellationToken cancellationToken)
    {
        // Reads + guards run outside the transaction (fail fast before acquiring DB resources).
        var withdrawal = await _context.Withdrawals
            .Include(w => w.Wallet).ThenInclude(wall => wall.TutorProfile).ThenInclude(tp => tp.User)
            .Include(w => w.ProcessingStartedByAdmin)
            .Include(w => w.ProcessedByAdmin)
            .FirstOrDefaultAsync(w => w.Id == request.WithdrawalId, cancellationToken);

        if (withdrawal == null)
        {
            throw new NotFoundException("Withdrawal", request.WithdrawalId);
        }

        // Strict State Transition Guard (DEC-WD-003, INV-WD-004): Must be in Processing status
        if (withdrawal.Status != WithdrawalStatus.Processing)
        {
            throw new ConflictException(
                $"Cannot fail withdrawal in '{withdrawal.Status}' status. Must be in Processing status.");
        }

        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.AdminId, cancellationToken);
        if (admin == null)
        {
            throw new UnauthorizedException("Admin user not found.");
        }

        var now = DateTime.UtcNow;

        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
        // Row-level locking (FOR UPDATE)
        var wallet = await _context.Wallets
            .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"Id\" = {withdrawal.WalletId} FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);

        if (wallet == null)
        {
            throw new BadRequestException("Tutor wallet not found.");
        }

        // Domain State Transition: Fail (DEC-WD-003, DEC-WD-004)
        withdrawal.Fail(request.Reason, request.AdminId);
        withdrawal.ProcessedByAdmin = admin;

        // Atomic restoration of AvailableBalance (DEC-WD-004, DEC-WD-007)
        wallet.CreditAvailable(withdrawal.Amount, now);

        // Record immutable ledger adjustment entry (DEC-WD-004, DEC-WD-009)
        var adjustmentEntry = new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = wallet.Id,
            WithdrawalId = withdrawal.Id,
            Type = WalletTransactionType.WithdrawalFailedAdjustmentCredit,
            Amount = withdrawal.Amount,
            BalanceAfter = wallet.AvailableBalance,
            Description = $"Refund for failed withdrawal #{withdrawal.Id}: {request.Reason.Trim()}",
            CreatedByUserId = admin.Id,
            CreatedAt = now
        };

        _context.WalletTransactions.Add(adjustmentEntry);

        // Enqueue Outbox Message in same DB transaction (DEC-S7-012, SP7-INT-001)
        _context.AddOutboxMessage(new WithdrawalFailedEvent(
            withdrawal.Id,
            withdrawal.Wallet.TutorProfileId,
            withdrawal.Wallet.TutorProfile.UserId,
            new MoneyDto(withdrawal.Amount),
            withdrawal.FailureReason!));

        await _auditLogService.LogAsync(
            action: "WithdrawalFailed",
            entityName: "Withdrawal",
            entityId: withdrawal.Id.ToString(),
            userId: request.AdminId,
            oldValues: new { Status = WithdrawalStatus.Processing.ToString() },
            newValues: new { Status = withdrawal.Status.ToString(), withdrawal.FailureReason },
            cancellationToken: cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        // F-24: outbox-only delivery (OutboxDispatcherJob). No direct publish.

        return new WithdrawalDto(
            Id: withdrawal.Id,
            WalletId: withdrawal.WalletId,
            TutorProfileId: withdrawal.Wallet.TutorProfileId,
            TutorName: withdrawal.Wallet.TutorProfile.User.FullName,
            TutorEmail: withdrawal.Wallet.TutorProfile.User.Email,
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
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
