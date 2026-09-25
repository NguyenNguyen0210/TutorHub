namespace TutorHub.Application.Features.StudentWallets.DTOs;

public record VnPayTopUpRedirectDto(
    Guid TopUpRequestId,
    string PaymentUrl,
    string MerchantReference,
    decimal Amount,
    DateTime ExpireAt
);
