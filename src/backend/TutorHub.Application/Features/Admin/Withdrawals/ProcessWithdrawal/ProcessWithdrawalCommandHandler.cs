using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Withdrawals.ProcessWithdrawal;

public class ProcessWithdrawalCommandHandler : IRequestHandler<ProcessWithdrawalCommand, WithdrawalDto>
{
    private readonly IAppDbContext _context;
    private readonly IAuditLogService _auditLogService;
    private readonly ICurrentUserService _currentUserService;

    public ProcessWithdrawalCommandHandler(
        IAppDbContext context,
        IAuditLogService auditLogService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _auditLogService = auditLogService;
        _currentUserService = currentUserService;
    }

    public async Task<WithdrawalDto> Handle(ProcessWithdrawalCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var withdrawal = await _context.Withdrawals
            .Include(w => w.Wallet).ThenInclude(wall => wall.User)
            .Include(w => w.ProcessingStartedByAdmin)
            .Include(w => w.ProcessedByAdmin)
            .FirstOrDefaultAsync(w => w.Id == request.WithdrawalId, cancellationToken);

        if (withdrawal == null)
        {
            throw new NotFoundException("Withdrawal", request.WithdrawalId);
        }

        if (withdrawal.Status != WithdrawalStatus.Pending)
        {
            throw new ConflictException(
                $"Cannot mark withdrawal as Processing from '{withdrawal.Status}' status. Must be in Pending status.");
        }

        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (admin == null)
        {
            throw new UnauthorizedException("Admin user not found.");
        }

        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);
        await _context.Database.ExecuteSqlInterpolatedAsync(
            $"SELECT 1 FROM \"Withdrawals\" WHERE \"Id\" = {withdrawal.Id} FOR UPDATE",
            cancellationToken);
        var currentStatus = await _context.Withdrawals.AsNoTracking()
            .Where(w => w.Id == withdrawal.Id)
            .Select(w => w.Status)
            .FirstAsync(cancellationToken);
        if (currentStatus != WithdrawalStatus.Pending)
            throw new ConflictException($"Cannot mark withdrawal as Processing from '{currentStatus}' status.");

        withdrawal.MarkProcessing(userId);
        withdrawal.ProcessingStartedByAdmin = admin;

        await _auditLogService.LogAsync(
            action: "WithdrawalProcessingStarted",
            entityName: "Withdrawal",
            entityId: withdrawal.Id.ToString(),
            userId: userId,
            oldValues: new { Status = WithdrawalStatus.Pending.ToString() },
            newValues: new { Status = withdrawal.Status.ToString() },
            cancellationToken: cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

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
            ProcessingStartedByAdminName: admin.FullName,
            ProcessedAt: withdrawal.ProcessedAt,
            ProcessedByAdminId: withdrawal.ProcessedByAdminId,
            ProcessedByAdminName: withdrawal.ProcessedByAdmin?.FullName,
            FailureReason: withdrawal.FailureReason
        );
    }
}
