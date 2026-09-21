using MediatR;
using TutorHub.Application.Common.Payments;

namespace TutorHub.Application.Features.Payments.HandlePaymentWebhook;

public record HandlePaymentWebhookCommand(
    IReadOnlyDictionary<string, string> Parameters
) : IRequest<PaymentWebhookAck>;
