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

    public ProcessWithdrawalCommandHandler(IAppDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    public async Task<WithdrawalDto> Handle(ProcessWithdrawalCommand request, CancellationToken cancellationToken)
    {
        var withdrawal = await _context.Withdrawals
            .Include(w => w.Wallet).ThenInclude(wall => wall.TutorProfile).ThenInclude(tp => tp.User)
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

        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.AdminId, cancellationToken);
        if (admin == null)
        {
            throw new UnauthorizedException("Admin user not found.");
        }

        withdrawal.MarkProcessing(request.AdminId);
        withdrawal.ProcessingStartedByAdmin = admin;

        await _auditLogService.LogAsync(
            action: "WithdrawalProcessingStarted",
            entityName: "Withdrawal",
            entityId: withdrawal.Id.ToString(),
            userId: request.AdminId,
            oldValues: new { Status = WithdrawalStatus.Pending.ToString() },
            newValues: new { Status = withdrawal.Status.ToString() },
            cancellationToken: cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

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
            ProcessingStartedByAdminName: admin.FullName,
            ProcessedAt: withdrawal.ProcessedAt,
            ProcessedByAdminId: withdrawal.ProcessedByAdminId,
            ProcessedByAdminName: withdrawal.ProcessedByAdmin?.FullName,
            FailureReason: withdrawal.FailureReason
        );
    }
}
