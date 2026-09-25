using MediatR;

namespace TutorHub.Application.Features.Payments.PayFromWallet;

public record PayBookingFromWalletCommand(Guid BookingId) : IRequest<PayBookingFromWalletResultDto>;
