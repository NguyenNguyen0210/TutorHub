using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Wallets.PayoutAccount.UpdatePayoutAccount;

public class UpdatePayoutAccountCommandHandler : IRequestHandler<UpdatePayoutAccountCommand, TutorPayoutAccountDto>
{
    private readonly IAppDbContext _context;

    public UpdatePayoutAccountCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<TutorPayoutAccountDto> Handle(UpdatePayoutAccountCommand request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .FirstOrDefaultAsync(t => t.UserId == request.UserId, cancellationToken);

        if (tutor == null)
        {
            throw new ForbiddenException("Only registered tutors can update payout destination details.");
        }

        tutor.SetPayoutAccount(
            bankName: request.BankName,
            accountNumber: request.AccountNumber,
            accountHolderName: request.AccountHolderName,
            bankCode: request.BankCode
        );

        await _context.SaveChangesAsync(cancellationToken);

        return new TutorPayoutAccountDto(
            BankName: tutor.BankName,
            BankCode: tutor.BankCode,
            AccountNumber: tutor.AccountNumber,
            AccountHolderName: tutor.AccountHolderName
        );
    }
}
