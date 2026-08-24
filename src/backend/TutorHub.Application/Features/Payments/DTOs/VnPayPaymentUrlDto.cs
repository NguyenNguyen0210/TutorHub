namespace TutorHub.Application.Features.Payments.DTOs;

public record VnPayPaymentUrlDto(
    string PaymentUrl,
    string MerchantReference,
    Guid BookingId,
    DateTime ExpireAt
);
