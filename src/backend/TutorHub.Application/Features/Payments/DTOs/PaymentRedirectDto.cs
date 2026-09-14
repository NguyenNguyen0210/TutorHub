namespace TutorHub.Application.Features.Payments.DTOs;

public record PaymentRedirectDto(
    string PaymentUrl,
    string MerchantReference,
    Guid BookingId,
    DateTime ExpireAt
);
