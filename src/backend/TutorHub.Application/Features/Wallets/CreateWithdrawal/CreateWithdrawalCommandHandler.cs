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
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;

    public CreateWithdrawalCommandHandler(IAppDbContext context, IClock clock, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _currentUserService = currentUserService;
    }

    public async Task<WithdrawalDto> Handle(CreateWithdrawalCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
        var tutor = await _context.TutorProfiles
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.UserId == userId, cancellationToken);

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

        var now = _clock.UtcNow;

        // Enforce minimum withdrawal amount configured on platform (DEC-WD-001)
        var minWithdrawalSetting = await _context.PlatformSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == "MinWithdrawalAmount", cancellationToken);

        decimal minAmount = 50_000m;
        if (minWithdrawalSetting != null && decimal.TryParse(minWithdrawalSetting.Value, out var parsedMin) && parsedMin > 0)
        {
            minAmount = parsedMin;
        }

        if (request.Amount < minAmount)
        {
            throw new BadRequestException($"Withdrawal amount must be at least {minAmount:N0} VND.");
        }

        // Row-level locking (FOR UPDATE)
        var wallet = await _context.Wallets
            .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"TutorProfileId\" = {tutor.Id} FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);

        if (wallet == null)
        {
            throw new BadRequestException("Tutor wallet not found.");
        }

        // Concurrency-safe stateful balance verification (DEC-WD-001, DEC-S8-001).
        // F-23: guarded domain math maps to 400 via the catch below.
        try
        {
            // Deduct available balance immediately (DEC-WD-007)
            wallet.DebitAvailableForWithdrawal(request.Amount, now);
        }
        catch (InvalidOperationException ex)
        {
            throw new BadRequestException(ex.Message);
        }
        catch (ArgumentException ex)
        {
            throw new BadRequestException(ex.Message);
        }

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

        // Enqueue Outbox Message in same DB transaction (DEC-S7-012, SP7-INT-001)
        _context.AddOutboxMessage(new WithdrawalRequestedEvent(
            withdrawal.Id,
            tutor.Id,
            tutor.UserId,
            new MoneyDto(withdrawal.Amount)));

        await _context.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        // F-24: outbox-only delivery. OutboxDispatcherJob is the single
        // delivery path; no direct in-process publish (duplicate EventIds).

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
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
