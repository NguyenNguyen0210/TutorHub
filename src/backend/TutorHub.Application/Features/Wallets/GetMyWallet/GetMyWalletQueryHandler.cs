using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wallets.GetMyWallet;

public class GetMyWalletQueryHandler : IRequestHandler<GetMyWalletQuery, WalletDto>
{
    private readonly IAppDbContext _context;

    public GetMyWalletQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<WalletDto> Handle(GetMyWalletQuery request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .FirstOrDefaultAsync(t => t.UserId == request.UserId, cancellationToken);

        if (tutor == null)
        {
            throw new ForbiddenException("Only registered tutors have a wallet.");
        }

        var wallet = await _context.Wallets
            .FirstOrDefaultAsync(w => w.TutorProfileId == tutor.Id, cancellationToken);

        if (wallet == null)
        {
            wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                TutorProfileId = tutor.Id,
                PendingBalance = 0,
                AvailableBalance = 0,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Wallets.Add(wallet);
            await _context.SaveChangesAsync(cancellationToken);
        }

        // Calculate total pending withdrawals
        var pendingWithdrawal = await _context.Withdrawals
            .Where(w => w.WalletId == wallet.Id && w.Status == WithdrawalStatus.Pending)
            .SumAsync(w => (decimal?)w.Amount, cancellationToken) ?? 0;

        var totalBalance = wallet.PendingBalance + wallet.AvailableBalance + pendingWithdrawal;

        return new WalletDto(
            Id: wallet.Id,
            TutorProfileId: tutor.Id,
            PendingBalance: wallet.PendingBalance,
            AvailableBalance: wallet.AvailableBalance,
            PendingWithdrawal: pendingWithdrawal,
            TotalBalance: totalBalance,
            UpdatedAt: wallet.UpdatedAt
        );
    }
}
