using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.StudentWallets.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.StudentWallets.Commands.RequestWithdrawal;

public class StudentRequestWithdrawalCommandHandler : IRequestHandler<StudentRequestWithdrawalCommand, StudentWithdrawalDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IClock _clock;

    public StudentRequestWithdrawalCommandHandler(IAppDbContext context, ICurrentUserService currentUserService, IClock clock)
    {
        _context = context;
        _currentUserService = currentUserService;
        _clock = clock;
    }

    public async Task<StudentWithdrawalDto> Handle(StudentRequestWithdrawalCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();
        var now = _clock.UtcNow;

        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var student = await _context.StudentProfiles
                .Include(s => s.User)
                .Include(s => s.Wallet)
                .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

            if (student == null)
            {
                throw new ForbiddenException("Only registered students can request a withdrawal.");
            }

            if (student.User.Status != AccountStatus.Active)
            {
                throw new ForbiddenException($"Cannot request withdrawal while account is '{student.User.Status}'.");
            }

            // Enforce minimum withdrawal amount (defaults to 50,000 VND)
            var minSetting = await _context.PlatformSettings.AsNoTracking()
                .FirstOrDefaultAsync(s => s.Key == "MinWithdrawalAmount", cancellationToken);

            decimal minAmount = 50_000m;
            if (minSetting != null && decimal.TryParse(minSetting.Value, out var parsedMin) && parsedMin > 0)
            {
                minAmount = parsedMin;
            }

            if (request.Amount < minAmount)
            {
                throw new BadRequestException($"Withdrawal amount must be at least {minAmount:N0} VND.");
            }

            // Pessimistic row-level lock on student wallet
            var wallet = await _context.StudentWallets
                .FromSqlInterpolated($"SELECT * FROM \"StudentWallets\" WHERE \"StudentProfileId\" = {student.Id} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            if (wallet == null)
            {
                throw new BadRequestException("Student wallet not found.");
            }

            if (wallet.AvailableBalance < request.Amount)
            {
                throw new BadRequestException($"Insufficient available balance. Available: {wallet.AvailableBalance:N0} VND, Requested: {request.Amount:N0} VND.");
            }

            // Reserve funds (INV-STUDENT-WALLET-005): Available decreases, Reserved increases
            var balanceBefore = wallet.AvailableBalance;
            wallet.ReserveForWithdrawal(request.Amount, now);
            var balanceAfter = wallet.AvailableBalance;

            var withdrawal = new StudentWithdrawal
            {
                Id = Guid.NewGuid(),
                StudentWalletId = wallet.Id,
                Amount = request.Amount,
                Status = WithdrawalStatus.Pending,
                BankName = request.BankName.Trim(),
                BankCode = string.IsNullOrWhiteSpace(request.BankCode) ? null : request.BankCode.Trim().ToUpperInvariant(),
                AccountNumber = request.AccountNumber.Trim(),
                AccountHolderName = request.AccountHolderName.Trim().ToUpperInvariant(),
                Note = request.Note?.Trim(),
                RequestedAt = now
            };

            _context.StudentWithdrawals.Add(withdrawal);

            // Record initial ledger hold entry
            var ledger = new StudentWalletTransaction
            {
                Id = Guid.NewGuid(),
                StudentWalletId = wallet.Id,
                Type = StudentWalletTransactionType.WithdrawalDebit,
                Direction = FinancialDirection.Debit,
                Amount = request.Amount,
                BalanceBefore = balanceBefore,
                BalanceAfter = balanceAfter,
                ReferenceType = "StudentWithdrawal",
                ReferenceId = withdrawal.Id,
                Description = $"Tạm giữ số dư để rút tiền về {withdrawal.BankName} - {withdrawal.AccountNumber}",
                CreatedByUserId = userId,
                CreatedAt = now
            };

            _context.StudentWalletTransactions.Add(ledger);

            // Outbox business event
            _context.AddOutboxMessage(new StudentWithdrawalRequestedEvent(
                withdrawal.Id,
                student.Id,
                userId,
                new MoneyDto(request.Amount, "VND"),
                Guid.NewGuid(),
                1,
                now
            ));

            await _context.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return new StudentWithdrawalDto
            {
                Id = withdrawal.Id,
                StudentWalletId = withdrawal.StudentWalletId,
                Amount = withdrawal.Amount,
                Status = withdrawal.Status,
                BankName = withdrawal.BankName,
                BankCode = withdrawal.BankCode,
                AccountNumber = withdrawal.AccountNumber,
                AccountHolderName = withdrawal.AccountHolderName,
                Note = withdrawal.Note,
                RequestedAt = withdrawal.RequestedAt
            };
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
