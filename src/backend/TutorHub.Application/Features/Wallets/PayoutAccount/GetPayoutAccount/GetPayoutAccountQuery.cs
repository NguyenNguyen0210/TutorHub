using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Wallets.PayoutAccount.GetPayoutAccount;

public record GetPayoutAccountQuery(Guid UserId) : IRequest<TutorPayoutAccountDto>;

public class GetPayoutAccountQueryHandler : IRequestHandler<GetPayoutAccountQuery, TutorPayoutAccountDto>
{
    private readonly IAppDbContext _context;

    public GetPayoutAccountQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<TutorPayoutAccountDto> Handle(GetPayoutAccountQuery request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.UserId == request.UserId, cancellationToken);

        if (tutor == null)
        {
            throw new ForbiddenException("Only registered tutors can access payout destination details.");
        }

        return new TutorPayoutAccountDto(
            BankName: tutor.BankName,
            BankCode: tutor.BankCode,
            AccountNumber: tutor.AccountNumber,
            AccountHolderName: tutor.AccountHolderName
        );
    }
}
