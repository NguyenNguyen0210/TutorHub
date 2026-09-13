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
    private readonly ICurrentUserService _currentUserService;

    public GetMyWalletQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<WalletDto> Handle(GetMyWalletQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var tutor = await _context.TutorProfiles
            .FirstOrDefaultAsync(t => t.UserId == userId, cancellationToken);

        if (tutor == null)
        {
            throw new ForbiddenException("Only registered tutors have a wallet.");
        }

        var wallet = await _context.Wallets
            .FirstOrDefaultAsync(w => w.TutorProfileId == tutor.Id, cancellationToken);

        // A missing wallet is a legitimate zero-balance state for a tutor who has
        // not sold anything yet. This is a read path: never create rows here.
        var walletId = wallet?.Id ?? Guid.Empty;
        var pendingBalance = wallet?.PendingBalance ?? 0m;
        var availableBalance = wallet?.AvailableBalance ?? 0m;
        var heldBalance = wallet?.HeldBalance ?? 0m;
        var updatedAt = wallet?.UpdatedAt ?? DateTime.MinValue;

        // Calculate total pending/processing withdrawals
        var pendingWithdrawal = await _context.Withdrawals
            .Where(w => w.WalletId == walletId &&
                       (w.Status == WithdrawalStatus.Pending || w.Status == WithdrawalStatus.Processing))
            .SumAsync(w => (decimal?)w.Amount, cancellationToken) ?? 0;

        var totalBalance = pendingBalance + availableBalance + pendingWithdrawal;
        var withdrawableBalance = availableBalance - heldBalance;

        return new WalletDto(
            Id: walletId,
            TutorProfileId: tutor.Id,
            PendingBalance: pendingBalance,
            AvailableBalance: availableBalance,
            HeldBalance: heldBalance,
            WithdrawableBalance: withdrawableBalance,
            PendingWithdrawal: pendingWithdrawal,
            TotalBalance: totalBalance,
            UpdatedAt: updatedAt
        );
    }
}
