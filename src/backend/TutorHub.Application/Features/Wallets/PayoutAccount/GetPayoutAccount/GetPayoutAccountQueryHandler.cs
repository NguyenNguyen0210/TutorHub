using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Wallets.PayoutAccount.GetPayoutAccount;

public class GetPayoutAccountQueryHandler : IRequestHandler<GetPayoutAccountQuery, TutorPayoutAccountDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetPayoutAccountQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<TutorPayoutAccountDto> Handle(GetPayoutAccountQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var tutor = await _context.TutorProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.UserId == userId, cancellationToken);

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
