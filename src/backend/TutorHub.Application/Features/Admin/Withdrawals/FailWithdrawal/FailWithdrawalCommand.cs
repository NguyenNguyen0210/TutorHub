using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Withdrawals.FailWithdrawal;

public record FailWithdrawalCommand(
    Guid WithdrawalId,
    Guid AdminId,
    string Reason
) : IRequest<WithdrawalDto>;

public class FailWithdrawalCommandValidator : AbstractValidator<FailWithdrawalCommand>
{
    public FailWithdrawalCommandValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Failure reason is mandatory.")
            .MaximumLength(500).WithMessage("Failure reason cannot exceed 500 characters.");
    }
}

public class FailWithdrawalCommandHandler : IRequestHandler<FailWithdrawalCommand, WithdrawalDto>
{
    private readonly IAppDbContext _context;
    private readonly IPublisher _publisher;

    public FailWithdrawalCommandHandler(IAppDbContext context, IPublisher publisher)
    {
        _context = context;
        _publisher = publisher;
    }

    public async Task<WithdrawalDto> Handle(FailWithdrawalCommand request, CancellationToken cancellationToken)
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

        // Strict State Transition Guard (DEC-WD-003, INV-WD-004): Must be in Processing status
        if (withdrawal.Status != WithdrawalStatus.Processing)
        {
            throw new ConflictException(
                $"Cannot fail withdrawal in '{withdrawal.Status}' status. Must be in Processing status.");
        }

        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.AdminId, cancellationToken);
        if (admin == null)
        {
            throw new UnauthorizedException("Admin user not found.");
        }

        var now = DateTime.UtcNow;

        // Execute with PostgreSQL row-level locking (FOR UPDATE) on Wallet when supported
        Wallet? wallet;
        if (_context.Database?.ProviderName != null &&
            _context.Database.ProviderName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
        {
            wallet = await _context.Wallets
                .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"Id\" = {withdrawal.WalletId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);
        }
        else
        {
            wallet = await _context.Wallets
                .FirstOrDefaultAsync(w => w.Id == withdrawal.WalletId, cancellationToken);
        }

        if (wallet == null)
        {
            throw new BadRequestException("Tutor wallet not found.");
        }

        // Domain State Transition: Fail (DEC-WD-003, DEC-WD-004)
        withdrawal.Fail(request.Reason, request.AdminId);
        withdrawal.ProcessedByAdmin = admin;

        // Atomic restoration of AvailableBalance (DEC-WD-004, DEC-WD-007)
        wallet.AvailableBalance += withdrawal.Amount;
        wallet.UpdatedAt = now;

        // Record immutable ledger adjustment entry (DEC-WD-004, DEC-WD-009)
        var adjustmentEntry = new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = wallet.Id,
            WithdrawalId = withdrawal.Id,
            Type = WalletTransactionType.WithdrawalFailedAdjustmentCredit,
            Amount = withdrawal.Amount,
            BalanceAfter = wallet.AvailableBalance,
            Description = $"Refund for failed withdrawal #{withdrawal.Id}: {request.Reason.Trim()}",
            CreatedByUserId = admin.Id,
            CreatedAt = now
        };

        _context.WalletTransactions.Add(adjustmentEntry);

        // Enqueue Outbox Message in same DB transaction (DEC-S7-012, SP7-INT-001)
        _context.AddOutboxMessage(new WithdrawalFailedEvent(
            withdrawal.Id,
            withdrawal.Wallet.TutorProfileId,
            withdrawal.Wallet.TutorProfile.UserId,
            new MoneyDto(withdrawal.Amount),
            withdrawal.FailureReason!));

        await _context.SaveChangesAsync(cancellationToken);

        // Publish business event strictly post-commit (DEC-WD-006)
        await _publisher.Publish(
            new WithdrawalFailedEvent(
                withdrawal.Id,
                withdrawal.Wallet.TutorProfileId,
                withdrawal.Wallet.TutorProfile.UserId,
                new MoneyDto(withdrawal.Amount),
                withdrawal.FailureReason!
            ),
            cancellationToken
        );

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
