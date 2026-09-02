using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Admin.Withdrawals.GetAdminWithdrawalById;

public record GetAdminWithdrawalByIdQuery(Guid WithdrawalId) : IRequest<WithdrawalDto>;

public class GetAdminWithdrawalByIdQueryHandler : IRequestHandler<GetAdminWithdrawalByIdQuery, WithdrawalDto>
{
    private readonly IAppDbContext _context;

    public GetAdminWithdrawalByIdQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<WithdrawalDto> Handle(GetAdminWithdrawalByIdQuery request, CancellationToken cancellationToken)
    {
        var withdrawal = await _context.Withdrawals
            .AsNoTracking()
            .Include(w => w.Wallet).ThenInclude(wall => wall.TutorProfile).ThenInclude(tp => tp.User)
            .Include(w => w.ProcessingStartedByAdmin)
            .Include(w => w.ProcessedByAdmin)
            .FirstOrDefaultAsync(w => w.Id == request.WithdrawalId, cancellationToken);

        if (withdrawal == null)
        {
            throw new NotFoundException("Withdrawal", request.WithdrawalId);
        }

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
            ProcessedByAdminName: withdrawal.ProcessedByAdmin?.FullName,
            FailureReason: withdrawal.FailureReason
        );
    }
}
