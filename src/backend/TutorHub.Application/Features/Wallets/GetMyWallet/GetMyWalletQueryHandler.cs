using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.DTOs;
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

        var tutor = _context.TutorProfiles != null
            ? await _context.TutorProfiles.FirstOrDefaultAsync(t => t.UserId == userId, cancellationToken)
            : null;
        var student = _context.StudentProfiles != null
            ? await _context.StudentProfiles.FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken)
            : null;

        var tutorId = tutor?.Id;
        var studentId = student?.Id;

        var wallet = await _context.Wallets
            .FirstOrDefaultAsync(w => w.UserId == userId || (tutorId != null && w.TutorProfileId == tutorId) || (studentId != null && w.StudentProfileId == studentId), cancellationToken);

        // A missing wallet is a legitimate zero-balance state.
        var walletId = wallet?.Id ?? Guid.Empty;
        var pendingBalance = wallet?.PendingBalance ?? 0m;
        var availableBalance = wallet?.AvailableBalance ?? 0m;
        var withdrawingBalance = wallet?.WithdrawingBalance ?? 0m;
        var updatedAt = wallet?.UpdatedAt ?? DateTime.MinValue;

        // Calculate total pending/processing withdrawals
        var pendingWithdrawal = wallet != null && _context.Withdrawals != null
            ? await _context.Withdrawals
                .Where(w => w.WalletId == wallet.Id &&
                            (w.Status == WithdrawalStatus.Pending || w.Status == WithdrawalStatus.Processing))
                .SumAsync(w => (decimal?)w.Amount, cancellationToken) ?? 0m
            : 0m;

        // Fallback to withdrawingBalance if no explicit withdrawal records were found
        if (pendingWithdrawal == 0m && withdrawingBalance > 0m)
        {
            pendingWithdrawal = withdrawingBalance;
        }

        var totalBalance = pendingBalance + availableBalance + pendingWithdrawal;

        return new WalletDto(
            Id: walletId,
            TutorProfileId: tutorId,
            PendingBalance: pendingBalance,
            AvailableBalance: availableBalance,
            WithdrawableBalance: availableBalance,
            PendingWithdrawal: pendingWithdrawal,
            TotalBalance: totalBalance,
            UpdatedAt: updatedAt
        )
        {
            UserId = userId,
            StudentProfileId = studentId
        };
    }
}