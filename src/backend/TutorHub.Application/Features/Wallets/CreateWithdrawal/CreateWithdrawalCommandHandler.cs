using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Settings;
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
    private readonly IOptions<WithdrawalOptions>? _withdrawalOptions;

    public CreateWithdrawalCommandHandler(
        IAppDbContext context,
        IClock clock,
        ICurrentUserService currentUserService,
        IOptions<WithdrawalOptions>? withdrawalOptions = null)
    {
        _context = context;
        _clock = clock;
        _currentUserService = currentUserService;
        _withdrawalOptions = withdrawalOptions;
    }

    public async Task<WithdrawalDto> Handle(CreateWithdrawalCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user == null)
            {
                throw new UnauthorizedException("User not found.");
            }

            // Validate account status - suspended/banned users cannot withdraw funds
            if (user.Status != AccountStatus.Active)
            {
                throw new ForbiddenException($"Cannot request withdrawal while account is '{user.Status}'. Please contact support.");
            }

            var tutor = await _context.TutorProfiles
                .FirstOrDefaultAsync(t => t.UserId == userId, cancellationToken);

            var student = await _context.StudentProfiles
                .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

            // Payout destination resolution: explicit request values take precedence over tutor profile defaults
            string bankName;
            string? bankCode;
            string accountNumber;
            string accountHolderName;

            if (!string.IsNullOrWhiteSpace(request.BankName) &&
                !string.IsNullOrWhiteSpace(request.AccountNumber) &&
                !string.IsNullOrWhiteSpace(request.AccountHolderName))
            {
                // Explicit payout destination supplied in request
                bankName = request.BankName.Trim();
                bankCode = string.IsNullOrWhiteSpace(request.BankCode) ? null : request.BankCode.Trim().ToUpperInvariant();
                accountNumber = request.AccountNumber.Trim();
                accountHolderName = request.AccountHolderName.Trim().ToUpperInvariant();
            }
            else if (tutor != null &&
                     !string.IsNullOrWhiteSpace(tutor.BankName) &&
                     !string.IsNullOrWhiteSpace(tutor.AccountNumber) &&
                     !string.IsNullOrWhiteSpace(tutor.AccountHolderName))
            {
                // Fall back to tutor profile payout defaults
                bankName = tutor.BankName.Trim();
                bankCode = string.IsNullOrWhiteSpace(tutor.BankCode) ? null : tutor.BankCode.Trim().ToUpperInvariant();
                accountNumber = tutor.AccountNumber.Trim();
                accountHolderName = tutor.AccountHolderName.Trim().ToUpperInvariant();
            }
            else
            {
                throw new BadRequestException("Payout destination details are incomplete. Either supply all destination fields or configure your default payout account.");
            }

            var now = _clock.UtcNow;

            // Enforce minimum withdrawal amount configured on platform
            var configuredMin = _withdrawalOptions?.Value?.MinAmount;
            decimal minAmount = configuredMin.HasValue && configuredMin.Value > 0 ? configuredMin.Value : 50_000m;

            if (request.Amount < minAmount)
            {
                throw new BadRequestException($"Withdrawal amount must be at least {minAmount:N0} VND.");
            }

            // Row-level locking (FOR UPDATE)
            var tutorId = tutor?.Id ?? Guid.Empty;
            var studentId = student?.Id ?? Guid.Empty;

            var wallet = await _context.Wallets
                .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"UserId\" = {userId} OR (\"TutorProfileId\" IS NOT NULL AND \"TutorProfileId\" = {tutorId}) OR (\"StudentProfileId\" IS NOT NULL AND \"StudentProfileId\" = {studentId}) FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            if (wallet == null)
            {
                throw new BadRequestException("Wallet not found.");
            }

            var balanceBefore = wallet.AvailableBalance;

            // Concurrency-safe stateful balance verification.
            try
            {
                // Deduct available balance immediately
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

            var balanceAfter = wallet.AvailableBalance;

            // Create pending withdrawal with immutable bank snapshot
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

            // Record immutable ledger entry
            var ledgerEntry = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                WithdrawalId = withdrawal.Id,
                Type = WalletTransactionType.WithdrawalDebit,
                Direction = FinancialDirection.Debit,
                Amount = request.Amount,
                BalanceBefore = balanceBefore,
                BalanceAfter = balanceAfter,
                ReferenceType = "Withdrawal",
                ReferenceId = withdrawal.Id,
                Description = $"Withdrawal request for {request.Amount:N0} VND to {bankName} - {accountNumber}",
                CreatedByUserId = user.Id,
                CreatedAt = now
            };

            _context.WalletTransactions.Add(ledgerEntry);

            // Enqueue Outbox Message in same DB transaction
            _context.AddOutboxMessage(new WithdrawalRequestedEvent(
                withdrawal.Id,
                tutor?.Id ?? Guid.Empty,
                user.Id,
                new MoneyDto(withdrawal.Amount)));

            await _context.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return new WithdrawalDto(
                Id: withdrawal.Id,
                WalletId: wallet.Id,
                TutorProfileId: tutor?.Id,
                TutorName: user.FullName,
                TutorEmail: user.Email,
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
            )
            {
                UserId = user.Id,
                StudentProfileId = student?.Id
            };
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }
}