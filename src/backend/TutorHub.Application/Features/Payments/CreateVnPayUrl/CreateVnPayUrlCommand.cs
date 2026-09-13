using MediatR;
using TutorHub.Application.Features.Payments.DTOs;

namespace TutorHub.Application.Features.Payments.CreateVnPayUrl;

public record CreateVnPayUrlCommand(
    Guid BookingId,
    string IpAddress
) : IRequest<VnPayPaymentUrlDto>;
