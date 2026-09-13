using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.DTOs;
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
                $"Cannot complete withdrawal in '{withdrawal.Status}' status. Must be in Processing status.");
        }

        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (admin == null)
        {
            throw new UnauthorizedException("Admin user not found.");
        }

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

        // Enqueue Outbox Message in same DB transaction (DEC-S7-012, SP7-INT-001)
        _context.AddOutboxMessage(new WithdrawalCompletedEvent(
            withdrawal.Id,
            withdrawal.Wallet.TutorProfileId,
            withdrawal.Wallet.TutorProfile.UserId,
            new MoneyDto(withdrawal.Amount)));

        await _context.SaveChangesAsync(cancellationToken);

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
}
