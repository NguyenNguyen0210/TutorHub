namespace TutorHub.Application.Common.Payments;

/// <summary>
/// Provider-agnostic input for generating a hosted payment redirect.
/// </summary>
public record PaymentRedirectRequest(
    string MerchantReference,
    decimal Amount,
    string OrderInfo,
    string IpAddress,
    DateTime CreatedAt,
    DateTime ExpireAt
);
