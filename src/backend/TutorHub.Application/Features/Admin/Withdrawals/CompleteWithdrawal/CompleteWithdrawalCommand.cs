using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Withdrawals.CompleteWithdrawal;

public record CompleteWithdrawalCommand(Guid WithdrawalId, Guid AdminId) : IRequest<WithdrawalDto>;

public class CompleteWithdrawalCommandHandler : IRequestHandler<CompleteWithdrawalCommand, WithdrawalDto>
{
    private readonly IAppDbContext _context;
    private readonly IPublisher _publisher;

    public CompleteWithdrawalCommandHandler(IAppDbContext context, IPublisher publisher)
    {
        _context = context;
        _publisher = publisher;
    }

    public async Task<WithdrawalDto> Handle(CompleteWithdrawalCommand request, CancellationToken cancellationToken)
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
                $"Cannot complete withdrawal in '{withdrawal.Status}' status. Must be in Processing status.");
        }

        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.AdminId, cancellationToken);
        if (admin == null)
        {
            throw new UnauthorizedException("Admin user not found.");
        }

        // Domain State Transition: Complete
        withdrawal.Complete(request.AdminId);
        withdrawal.ProcessedByAdmin = admin;

        await _context.SaveChangesAsync(cancellationToken);

        // Publish business event strictly post-commit (DEC-WD-006)
        await _publisher.Publish(
            new WithdrawalCompletedEvent(
                withdrawal.Id,
                withdrawal.Wallet.TutorProfileId,
                withdrawal.Wallet.TutorProfile.UserId,
                withdrawal.Amount
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
