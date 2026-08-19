using MediatR;
using TutorHub.Application.Features.Wallets.DTOs;

namespace TutorHub.Application.Features.Wallets.GetMyWallet;

public record GetMyWalletQuery(
    Guid UserId
) : IRequest<WalletDto>;
