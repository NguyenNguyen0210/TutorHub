namespace TutorHub.Application.Features.Payments.DTOs;

public record PaymentResultDto(
    bool Success,
    string Message,
    Guid BookingId,
    string MerchantReference,
    string? TransactionNo,
    decimal Amount
);
