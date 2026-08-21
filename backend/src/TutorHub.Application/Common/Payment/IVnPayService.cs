namespace TutorHub.Application.Common.Interfaces;

public interface IVnPayService
{
    string CreatePaymentUrl(VnPayPaymentRequest request);
    bool VerifySignature(IReadOnlyDictionary<string, string> parameters, string secureHash);
    string GetTmnCode();
}
