using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.StudentWallets.DTOs;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.StudentWallets.Commands.AdminCompleteWithdrawal;

public class AdminCompleteStudentWithdrawalCommandHandler : IRequestHandler<AdminCompleteStudentWithdrawalCommand, StudentWithdrawalDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IClock _clock;

    public AdminCompleteStudentWithdrawalCommandHandler(IAppDbContext context, ICurrentUserService currentUserService, IClock clock)
    {
        _context = context;
        _currentUserService = currentUserService;
        _clock = clock;
    }

    public async Task<StudentWithdrawalDto> Handle(AdminCompleteStudentWithdrawalCommand request, CancellationToken cancellationToken)
    {
        var adminId = _currentUserService.UserIdOrThrow();
        var now = _clock.UtcNow;

        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var withdrawal = await _context.StudentWithdrawals
                .Include(w => w.StudentWallet)
                    .ThenInclude(sw => sw.StudentProfile)
                .FirstOrDefaultAsync(w => w.Id == request.WithdrawalId, cancellationToken);

            if (withdrawal == null)
            {
                throw new NotFoundException(nameof(StudentWithdrawal), request.WithdrawalId);
            }

            // Concurrency lock on student wallet
            var wallet = await _context.StudentWallets
                .FromSqlInterpolated($"SELECT * FROM \"StudentWallets\" WHERE \"Id\" = {withdrawal.StudentWalletId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            if (wallet == null)
            {
                throw new NotFoundException(nameof(StudentWallet), withdrawal.StudentWalletId);
            }

            withdrawal.Complete(adminId);
            wallet.FinalizeWithdrawal(withdrawal.Amount, now);

            // Emit business event
            _context.AddOutboxMessage(new StudentWithdrawalCompletedEvent(
                withdrawal.Id,
                withdrawal.StudentWallet.StudentProfileId,
                withdrawal.StudentWallet.StudentProfile.UserId,
                new MoneyDto(withdrawal.Amount, "VND"),
                adminId,
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
                RequestedAt = withdrawal.RequestedAt,
                ProcessedAt = withdrawal.ProcessedAt,
                FailureReason = withdrawal.FailureReason
            };
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
