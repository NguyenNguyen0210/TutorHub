using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Withdrawals.RejectWithdrawal;

public class RejectWithdrawalCommandHandler : IRequestHandler<RejectWithdrawalCommand, WithdrawalDto>
{
    private readonly IAppDbContext _context;

    public RejectWithdrawalCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<WithdrawalDto> Handle(RejectWithdrawalCommand request, CancellationToken cancellationToken)
    {
        var withdrawal = await _context.Withdrawals
            .Include(w => w.Wallet).ThenInclude(wall => wall.TutorProfile).ThenInclude(tp => tp.User)
            .Include(w => w.ProcessedByAdmin)
            .FirstOrDefaultAsync(w => w.Id == request.WithdrawalId, cancellationToken);

        if (withdrawal == null)
        {
            throw new NotFoundException("Withdrawal", request.WithdrawalId);
        }

        // State Transition Guard: Only Pending withdrawals can be rejected
        if (withdrawal.Status != WithdrawalStatus.Pending)
        {
            throw new ConflictException($"Cannot reject withdrawal in '{withdrawal.Status}' status.");
        }

        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.AdminId, cancellationToken);
        var now = DateTime.UtcNow;

        // Transition to Rejected & Atomically refund AvailableBalance
        withdrawal.Status = WithdrawalStatus.Rejected;
        withdrawal.RejectionReason = request.Reason.Trim();
        withdrawal.ProcessedAt = now;
        withdrawal.ProcessedByAdminId = request.AdminId;
        withdrawal.ProcessedByAdmin = admin;

        withdrawal.Wallet.AvailableBalance += withdrawal.Amount;
        withdrawal.Wallet.UpdatedAt = now;

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
