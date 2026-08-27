using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wallets.CreateWithdrawal;

public class CreateWithdrawalCommandHandler : IRequestHandler<CreateWithdrawalCommand, WithdrawalDto>
{
    private readonly IAppDbContext _context;

    public CreateWithdrawalCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<WithdrawalDto> Handle(CreateWithdrawalCommand request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.UserId == request.UserId, cancellationToken);

        if (tutor == null)
        {
            throw new ForbiddenException("Only registered tutors can create withdrawal requests.");
        }

        var now = DateTime.UtcNow;

        // Execute with PostgreSQL row-level locking (FOR UPDATE)
        var wallet = await _context.Wallets
            .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"TutorProfileId\" = {tutor.Id} FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);

        if (wallet == null)
        {
            throw new BadRequestException("Tutor wallet not found.");
        }

        // Concurrency-safe stateful balance verification
        if (wallet.AvailableBalance < request.Amount)
        {
            throw new BadRequestException("Insufficient available balance.");
        }

        // Deduct available balance immediately
        wallet.AvailableBalance -= request.Amount;
        wallet.UpdatedAt = now;

        // Create pending withdrawal with bank snapshot
        var withdrawal = new Withdrawal
        {
            Id = Guid.NewGuid(),
            WalletId = wallet.Id,
            Amount = request.Amount,
            Status = WithdrawalStatus.Pending,
            BankName = request.BankName.Trim(),
            AccountNumber = request.AccountNumber.Trim(),
            AccountHolderName = request.AccountHolderName.Trim().ToUpperInvariant(),
            Note = request.Note?.Trim(),
            RequestedAt = now
        };

        _context.Withdrawals.Add(withdrawal);
        await _context.SaveChangesAsync(cancellationToken);

        return new WithdrawalDto(
            Id: withdrawal.Id,
            WalletId: wallet.Id,
            TutorProfileId: tutor.Id,
            TutorName: tutor.User.FullName,
            TutorEmail: tutor.User.Email,
            Amount: withdrawal.Amount,
            Status: withdrawal.Status,
            BankName: withdrawal.BankName,
            AccountNumber: withdrawal.AccountNumber,
            AccountHolderName: withdrawal.AccountHolderName,
            Note: withdrawal.Note,
            RequestedAt: withdrawal.RequestedAt,
            ProcessedAt: withdrawal.ProcessedAt,
            ProcessedByAdminId: withdrawal.ProcessedByAdminId,
            ProcessedByAdminName: null,
            RejectionReason: withdrawal.RejectionReason
        );
    }
}
