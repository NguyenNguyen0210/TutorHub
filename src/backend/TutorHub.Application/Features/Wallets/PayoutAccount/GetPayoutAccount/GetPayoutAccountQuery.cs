using MediatR;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Wallets.PayoutAccount.GetPayoutAccount;

public record GetPayoutAccountQuery : IRequest<TutorPayoutAccountDto>;
