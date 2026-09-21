using MediatR;
using TutorHub.Application.Features.Payments.DTOs;

namespace TutorHub.Application.Features.Payments.InitiatePayment;

public record InitiatePaymentCommand(
    Guid BookingId,
    string IpAddress
) : IRequest<PaymentRedirectDto>;
