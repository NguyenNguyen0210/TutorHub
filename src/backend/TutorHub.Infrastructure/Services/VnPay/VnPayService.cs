using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Payment;

namespace TutorHub.Infrastructure.Services.VnPay;

public class VnPayService : IVnPayService
{
    private readonly VnPayOptions _options;

    public VnPayService(IOptions<VnPayOptions> options)
    {
        _options = options.Value;
    }

    public string GetTmnCode() => _options.TmnCode;

    public string CreatePaymentUrl(VnPayPaymentRequest request)
    {
        var vnPay = new VnPayLibrary();

        // Convert UTC time to Vietnam Time (UTC+7) for VNPay date format
        var createDateVn = request.CreatedAt.AddHours(7).ToString("yyyyMMddHHmmss");
        var expireDateVn = request.ExpireAt.AddHours(7).ToString("yyyyMMddHHmmss");

        vnPay.AddRequestData("vnp_Version", _options.Version);
        vnPay.AddRequestData("vnp_Command", _options.Command);
        vnPay.AddRequestData("vnp_TmnCode", _options.TmnCode);
        vnPay.AddRequestData("vnp_Amount", ((long)(request.Amount * 100)).ToString());
        vnPay.AddRequestData("vnp_CreateDate", createDateVn);
        vnPay.AddRequestData("vnp_CurrCode", _options.CurrCode);
        vnPay.AddRequestData("vnp_IpAddr", string.IsNullOrWhiteSpace(request.IpAddress) ? "127.0.0.1" : request.IpAddress);
        vnPay.AddRequestData("vnp_Locale", _options.Locale);
        vnPay.AddRequestData("vnp_OrderInfo", request.OrderInfo);
        vnPay.AddRequestData("vnp_OrderType", _options.OrderType);
        vnPay.AddRequestData("vnp_ReturnUrl", _options.ReturnUrl);
        vnPay.AddRequestData("vnp_TxnRef", request.MerchantReference);
        vnPay.AddRequestData("vnp_ExpireDate", expireDateVn);

        var paymentUrl = vnPay.CreateRequestUrl(_options.BaseUrl, _options.HashSecret);
        return paymentUrl;
    }

    public bool VerifySignature(IReadOnlyDictionary<string, string> parameters, string secureHash)
    {
        var vnPay = new VnPayLibrary();

        foreach (var (key, value) in parameters)
        {
            if (!string.IsNullOrWhiteSpace(key) &&
                key.StartsWith("vnp_", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(key, "vnp_SecureHash", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(key, "vnp_SecureHashType", StringComparison.OrdinalIgnoreCase))
            {
                vnPay.AddResponseData(key, value);
            }
        }

        return vnPay.ValidateSignature(secureHash, _options.HashSecret);
    }
}
