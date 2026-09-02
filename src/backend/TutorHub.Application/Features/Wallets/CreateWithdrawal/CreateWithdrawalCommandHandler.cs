using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wallets.CreateWithdrawal;

public class CreateWithdrawalCommandHandler : IRequestHandler<CreateWithdrawalCommand, WithdrawalDto>
{
    private readonly IAppDbContext _context;
    private readonly IPublisher _publisher;

    public CreateWithdrawalCommandHandler(IAppDbContext context, IPublisher publisher)
    {
        _context = context;
        _publisher = publisher;
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

        // Account Status Guard (DEC-WD-005)
        if (tutor.User.Status != AccountStatus.Active)
        {
            throw new ForbiddenException($"Cannot request withdrawal while account is '{tutor.User.Status}'. Only active accounts are eligible.");
        }

        // Resolve Payout Destination with All-or-Nothing Fallback (DEC-WD-002)
        string bankName;
        string? bankCode;
        string accountNumber;
        string accountHolderName;

        if (!string.IsNullOrWhiteSpace(request.BankName) &&
            !string.IsNullOrWhiteSpace(request.AccountNumber) &&
            !string.IsNullOrWhiteSpace(request.AccountHolderName))
        {
            bankName = request.BankName.Trim();
            bankCode = string.IsNullOrWhiteSpace(request.BankCode) ? null : request.BankCode.Trim().ToUpperInvariant();
            accountNumber = request.AccountNumber.Trim();
            accountHolderName = request.AccountHolderName.Trim().ToUpperInvariant();
        }
        else if (string.IsNullOrWhiteSpace(request.BankName) &&
                 string.IsNullOrWhiteSpace(request.AccountNumber) &&
                 string.IsNullOrWhiteSpace(request.AccountHolderName))
        {
            // Fallback to saved profile details
            if (string.IsNullOrWhiteSpace(tutor.BankName) ||
                string.IsNullOrWhiteSpace(tutor.AccountNumber) ||
                string.IsNullOrWhiteSpace(tutor.AccountHolderName))
            {
                throw new BadRequestException("No saved payout bank account found. Please provide bank details or configure your payout account.");
            }

            bankName = tutor.BankName;
            bankCode = tutor.BankCode;
            accountNumber = tutor.AccountNumber;
            accountHolderName = tutor.AccountHolderName;
        }
        else
        {
            throw new BadRequestException("Payout destination details are incomplete. Either supply all destination fields or configure your default payout account.");
        }

        var now = DateTime.UtcNow;

        // Execute with PostgreSQL row-level locking (FOR UPDATE) when supported
        Wallet? wallet;
        if (_context.Database?.ProviderName != null &&
            _context.Database.ProviderName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
        {
            wallet = await _context.Wallets
                .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"TutorProfileId\" = {tutor.Id} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);
        }
        else
        {
            wallet = await _context.Wallets
                .FirstOrDefaultAsync(w => w.TutorProfileId == tutor.Id, cancellationToken);
        }

        if (wallet == null)
        {
            throw new BadRequestException("Tutor wallet not found.");
        }

        // Concurrency-safe stateful balance verification (DEC-WD-001)
        if (wallet.AvailableBalance < request.Amount)
        {
            throw new BadRequestException("Insufficient available balance.");
        }

        // Deduct available balance immediately (DEC-WD-007)
        wallet.AvailableBalance -= request.Amount;
        wallet.UpdatedAt = now;

        // Create pending withdrawal with immutable bank snapshot (DEC-WD-002, DEC-WD-003)
        var withdrawal = new Withdrawal
        {
            Id = Guid.NewGuid(),
            WalletId = wallet.Id,
            Amount = request.Amount,
            Status = WithdrawalStatus.Pending,
            BankName = bankName,
            BankCode = bankCode,
            AccountNumber = accountNumber,
            AccountHolderName = accountHolderName,
            Note = request.Note?.Trim(),
            RequestedAt = now
        };

        _context.Withdrawals.Add(withdrawal);

        // Record immutable ledger entry (DEC-WD-004, DEC-WD-009)
        var ledgerEntry = new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = wallet.Id,
            WithdrawalId = withdrawal.Id,
            Type = WalletTransactionType.WithdrawalDebit,
            Amount = request.Amount,
            BalanceAfter = wallet.AvailableBalance,
            Description = $"Withdrawal request for {request.Amount:N0} VND to {bankName} - {accountNumber}",
            CreatedByUserId = tutor.UserId,
            CreatedAt = now
        };

        _context.WalletTransactions.Add(ledgerEntry);

        await _context.SaveChangesAsync(cancellationToken);

        // Publish business event strictly post-commit (DEC-WD-006)
        await _publisher.Publish(
            new WithdrawalRequestedEvent(withdrawal.Id, tutor.Id, tutor.UserId, withdrawal.Amount),
            cancellationToken
        );

        return new WithdrawalDto(
            Id: withdrawal.Id,
            WalletId: wallet.Id,
            TutorProfileId: tutor.Id,
            TutorName: tutor.User.FullName,
            TutorEmail: tutor.User.Email,
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
            ProcessingStartedByAdminName: null,
            ProcessedAt: withdrawal.ProcessedAt,
            ProcessedByAdminId: withdrawal.ProcessedByAdminId,
            ProcessedByAdminName: null,
            FailureReason: withdrawal.FailureReason
        );
    }
}
