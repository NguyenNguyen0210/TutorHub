using MediatR;
using TutorHub.Application.Features.Payments.DTOs;

namespace TutorHub.Application.Features.Payments.GetPaymentResult;

public record GetPaymentResultQuery(
    IReadOnlyDictionary<string, string> Parameters
) : IRequest<PaymentResultDto>;
