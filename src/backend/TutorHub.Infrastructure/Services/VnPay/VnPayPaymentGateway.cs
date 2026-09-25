using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Payments;

namespace TutorHub.Infrastructure.Services.VnPay;

/// <summary>
/// VNPay 2.1.0 adapter. Owns every vendor wire detail: vnp_* parameters,
/// HMAC-SHA512 checksum, minor-unit amounts, merchant/terminal validation and
/// the provider acknowledgement codes expected by VNPay.
/// </summary>
public class VnPayPaymentGateway : IPaymentGateway
{
    private readonly VnPayOptions _options;

    public VnPayPaymentGateway(IOptions<VnPayOptions> options)
    {
        _options = options.Value;
    }

    public string CreateRedirect(PaymentRedirectRequest request)
    {
        var vnPay = new VnPayLibrary();

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

        return vnPay.CreateRequestUrl(_options.BaseUrl, _options.HashSecret);
    }

    public PaymentCallbackResult VerifyAndParseCallback(IReadOnlyDictionary<string, string> parameters)
    {
        if (!parameters.TryGetValue("vnp_SecureHash", out var secureHash) || string.IsNullOrWhiteSpace(secureHash))
        {
            return Invalid(PaymentCallbackError.InvalidSignature);
        }

        if (!VerifySignature(parameters, secureHash))
        {
            return Invalid(PaymentCallbackError.InvalidSignature);
        }

        parameters.TryGetValue("vnp_TmnCode", out var tmnCode);
        if (string.IsNullOrWhiteSpace(tmnCode) || !string.Equals(tmnCode, _options.TmnCode, StringComparison.OrdinalIgnoreCase))
        {
            return Invalid(PaymentCallbackError.InvalidRequest);
        }

        if (parameters.TryGetValue("vnp_CurrCode", out var currCode) &&
            !string.IsNullOrWhiteSpace(currCode) &&
            !string.Equals(currCode, "VND", StringComparison.OrdinalIgnoreCase))
        {
            return Invalid(PaymentCallbackError.InvalidRequest);
        }

        parameters.TryGetValue("vnp_TxnRef", out var txnRef);
        parameters.TryGetValue("vnp_ResponseCode", out var responseCode);
        parameters.TryGetValue("vnp_TransactionStatus", out var transactionStatus);
        parameters.TryGetValue("vnp_TransactionNo", out var transactionNo);
        parameters.TryGetValue("vnp_Amount", out var amountStr);

        if (string.IsNullOrWhiteSpace(txnRef) || !decimal.TryParse(amountStr, out var rawAmount))
        {
            return Invalid(PaymentCallbackError.InvalidRequest);
        }

        return new PaymentCallbackResult(
            IsVerified: true,
            Error: null,
            MerchantReference: txnRef,
            Amount: rawAmount / 100m,
            IsSuccessful: responseCode == "00" && (string.IsNullOrWhiteSpace(transactionStatus) || transactionStatus == "00"),
            ProviderTransactionId: transactionNo);
    }

    public PaymentWebhookAck BuildAcknowledgement(PaymentWebhookOutcome outcome)
    {
        return outcome switch
        {
            PaymentWebhookOutcome.Success => new PaymentWebhookAck("00", "Confirm Success"),
            PaymentWebhookOutcome.Duplicate => new PaymentWebhookAck("02", "Order already confirmed"),
            PaymentWebhookOutcome.NotFound => new PaymentWebhookAck("01", "Order not found"),
            PaymentWebhookOutcome.InvalidAmount => new PaymentWebhookAck("04", "Invalid amount"),
            PaymentWebhookOutcome.InvalidSignature => new PaymentWebhookAck("97", "Invalid Checksum"),
            _ => new PaymentWebhookAck("99", "Invalid Request"),
        };
    }

    private static PaymentCallbackResult Invalid(PaymentCallbackError error)
    {
        return new PaymentCallbackResult(
            IsVerified: false,
            Error: error,
            MerchantReference: null,
            Amount: 0,
            IsSuccessful: false,
            ProviderTransactionId: null);
    }

    private bool VerifySignature(IReadOnlyDictionary<string, string> parameters, string secureHash)
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
