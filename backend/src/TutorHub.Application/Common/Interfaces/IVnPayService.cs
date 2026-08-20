namespace TutorHub.Application.Common.Interfaces;

public record VnPayPaymentRequest(
    string MerchantReference,
    decimal Amount,
    string OrderInfo,
    string IpAddress,
    DateTime CreatedAt,
    DateTime ExpireAt
);

public interface IVnPayService
{
    string CreatePaymentUrl(VnPayPaymentRequest request);
    bool VerifySignature(IReadOnlyDictionary<string, string> parameters, string secureHash);
    string GetTmnCode();
}
