using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Withdrawals.ApproveWithdrawal;

public class ApproveWithdrawalCommandHandler : IRequestHandler<ApproveWithdrawalCommand, WithdrawalDto>
{
    private readonly IAppDbContext _context;

    public ApproveWithdrawalCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<WithdrawalDto> Handle(ApproveWithdrawalCommand request, CancellationToken cancellationToken)
    {
        var withdrawal = await _context.Withdrawals
            .Include(w => w.Wallet).ThenInclude(wall => wall.TutorProfile).ThenInclude(tp => tp.User)
            .Include(w => w.ProcessedByAdmin)
            .FirstOrDefaultAsync(w => w.Id == request.WithdrawalId, cancellationToken);

        if (withdrawal == null)
        {
            throw new NotFoundException("Withdrawal", request.WithdrawalId);
        }

        // State Transition Guard: Only Pending withdrawals can be approved
        if (withdrawal.Status != WithdrawalStatus.Pending)
        {
            throw new ConflictException($"Cannot approve withdrawal in '{withdrawal.Status}' status.");
        }

        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.AdminId, cancellationToken);
        var now = DateTime.UtcNow;

        // Transition to Completed. Do NOT deduct wallet AvailableBalance again (already deducted on creation).
        withdrawal.Status = WithdrawalStatus.Completed;
        withdrawal.ProcessedAt = now;
        withdrawal.ProcessedByAdminId = request.AdminId;
        withdrawal.ProcessedByAdmin = admin;

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
            AccountNumber: withdrawal.AccountNumber,
            AccountHolderName: withdrawal.AccountHolderName,
            Note: withdrawal.Note,
            RequestedAt: withdrawal.RequestedAt,
            ProcessedAt: withdrawal.ProcessedAt,
            ProcessedByAdminId: withdrawal.ProcessedByAdminId,
            ProcessedByAdminName: admin?.FullName,
            RejectionReason: withdrawal.RejectionReason
        );
    }
}
