namespace TutorHub.Application.Features.Payments.DTOs;

public record PaymentWebhookAckDto(
    string RspCode,
    string Message
);
