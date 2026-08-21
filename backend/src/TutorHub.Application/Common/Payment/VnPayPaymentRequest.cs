namespace TutorHub.Application.Common.Interfaces;

public record VnPayPaymentRequest(
    string MerchantReference,
    decimal Amount,
    string OrderInfo,
    string IpAddress,
    DateTime CreatedAt,
    DateTime ExpireAt
);