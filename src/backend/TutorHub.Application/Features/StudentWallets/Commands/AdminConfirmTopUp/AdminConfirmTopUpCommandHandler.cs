using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.StudentWallets.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.StudentWallets.Commands.AdminConfirmTopUp;

public class AdminConfirmTopUpCommandHandler : IRequestHandler<AdminConfirmTopUpCommand, TopUpRequestDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IClock _clock;

    public AdminConfirmTopUpCommandHandler(IAppDbContext context, ICurrentUserService currentUserService, IClock clock)
    {
        _context = context;
        _currentUserService = currentUserService;
        _clock = clock;
    }

    public async Task<TopUpRequestDto> Handle(AdminConfirmTopUpCommand request, CancellationToken cancellationToken)
    {
        var adminId = _currentUserService.UserIdOrThrow();
        var now = _clock.UtcNow;

        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var topUp = await _context.TopUpRequests
                .Include(r => r.StudentWallet)
                    .ThenInclude(w => w.StudentProfile)
                .FirstOrDefaultAsync(r => r.Id == request.TopUpRequestId, cancellationToken);

            if (topUp == null)
            {
                throw new NotFoundException(nameof(TopUpRequest), request.TopUpRequestId);
            }

            // Idempotency check (INV-STUDENT-WALLET-004): if already confirmed, do not credit twice
            if (topUp.Status == TopUpRequestStatus.Confirmed)
            {
                return MapToDto(topUp);
            }

            if (topUp.Status == TopUpRequestStatus.Rejected)
            {
                throw new BadRequestException("Cannot confirm an already rejected top-up request.");
            }

            // Pessimistic row-level lock on StudentWallet
            var wallet = await _context.StudentWallets
                .FromSqlInterpolated($"SELECT * FROM \"StudentWallets\" WHERE \"Id\" = {topUp.StudentWalletId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            if (wallet == null)
            {
                throw new NotFoundException(nameof(StudentWallet), topUp.StudentWalletId);
            }

            var balanceBefore = wallet.AvailableBalance;
            wallet.Credit(topUp.Amount, now);
            var balanceAfter = wallet.AvailableBalance;

            // Append-only immutable ledger entry (INV-STUDENT-WALLET-003)
            var ledgerEntry = new StudentWalletTransaction
            {
                Id = Guid.NewGuid(),
                StudentWalletId = wallet.Id,
                Type = StudentWalletTransactionType.TopUpCredit,
                Direction = FinancialDirection.Credit,
                Amount = topUp.Amount,
                BalanceBefore = balanceBefore,
                BalanceAfter = balanceAfter,
                ReferenceType = "TopUpRequest",
                ReferenceId = topUp.Id,
                Description = $"Xác nhận nạp tiền: {topUp.TransferReference}",
                Reason = request.AdminNote,
                CreatedByUserId = adminId,
                CreatedAt = now
            };

            _context.StudentWalletTransactions.Add(ledgerEntry);

            // Transition request status to Confirmed
            topUp.Confirm(adminId, now, request.AdminNote);

            // Emit business event
            _context.AddOutboxMessage(new StudentTopUpConfirmedEvent(
                topUp.Id,
                topUp.StudentWallet.StudentProfileId,
                topUp.StudentWallet.StudentProfile.UserId,
                new MoneyDto(topUp.Amount, "VND"),
                adminId,
                Guid.NewGuid(),
                1,
                now
            ));

            await _context.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return MapToDto(topUp);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static TopUpRequestDto MapToDto(TopUpRequest topUp) => new()
    {
        Id = topUp.Id,
        StudentWalletId = topUp.StudentWalletId,
        Amount = topUp.Amount,
        TransferReference = topUp.TransferReference,
        Status = topUp.Status,
        RequestedAt = topUp.RequestedAt,
        ProcessedAt = topUp.ProcessedAt,
        RejectionReason = topUp.RejectionReason,
        AdminNote = topUp.AdminNote
    };
}
