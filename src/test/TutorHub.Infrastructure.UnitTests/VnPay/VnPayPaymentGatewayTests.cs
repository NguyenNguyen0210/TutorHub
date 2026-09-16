using System.Net;
using FluentAssertions;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Payments;
using TutorHub.Infrastructure.Services.VnPay;
using Xunit;

namespace TutorHub.Infrastructure.UnitTests.VnPay;

public class VnPayPaymentGatewayTests
{
    private const string Secret = "test-secret-key-0123456789abcdef";
    private const string TmnCode = "TESTTMN";

    private static VnPayPaymentGateway CreateGateway() => new(
        Options.Create(new VnPayOptions
        {
            TmnCode = TmnCode,
            HashSecret = Secret,
            BaseUrl = "https://sandbox.test/paymentv2/vpcpay.html",
            ReturnUrl = "https://app.test/api/v1/payments/vnpay/return"
        }));

    private static Dictionary<string, string> SignCallback(
        string txnRef, decimal majorAmount, string responseCode, string status, string txnNo,
        string? tmnOverride = null, string? secretOverride = null)
    {
        // Sign through the production signing path: VnPayLibrary builds its
        // checksum over the same sorted, URL-encoded key set for request and
        // response data, so a request URL carrying the callback fields yields a
        // genuinely valid signed callback payload.
        var library = new VnPayLibrary();
        library.AddRequestData("vnp_TmnCode", tmnOverride ?? TmnCode);
        library.AddRequestData("vnp_CurrCode", "VND");
        library.AddRequestData("vnp_TxnRef", txnRef);
        library.AddRequestData("vnp_ResponseCode", responseCode);
        library.AddRequestData("vnp_TransactionStatus", status);
        library.AddRequestData("vnp_TransactionNo", txnNo);
        library.AddRequestData("vnp_Amount", ((long)(majorAmount * 100)).ToString());

        // Produce a genuinely signed payload through the production signing
        // path, then parse it back: proves gateway and library agree.
        var url = library.CreateRequestUrl("https://app.test/cb", secretOverride ?? Secret);
        var query = url[(url.IndexOf('?') + 1)..];

        return query.Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Select(part => part.Split('=', 2))
            .ToDictionary(
                kv => WebUtility.UrlDecode(kv[0]),
                kv => kv.Length > 1 ? WebUtility.UrlDecode(kv[1]) : string.Empty,
                StringComparer.OrdinalIgnoreCase);
    }

    [Fact]
    public void CreateRedirect_IncludesMerchantReferenceAndMinorUnitAmount()
    {
        var url = CreateGateway().CreateRedirect(new PaymentRedirectRequest(
            MerchantReference: "THB260912ABC123",
            Amount: 900_000m,
            OrderInfo: "order",
            IpAddress: "127.0.0.1",
            CreatedAt: DateTime.UtcNow,
            ExpireAt: DateTime.UtcNow.AddMinutes(15)));

        url.Should().Contain("vnp_TxnRef=THB260912ABC123");
        url.Should().Contain("vnp_Amount=90000000");
        url.Should().Contain("vnp_SecureHash=");
    }

    [Fact]
    public void VerifyAndParseCallback_ValidSignedPayload_ReturnsNormalizedResult()
    {
        var parameters = SignCallback("THB260912ABC123", 900_000m, "00", "00", "555000111");

        var result = CreateGateway().VerifyAndParseCallback(parameters);

        result.IsVerified.Should().BeTrue();
        result.Error.Should().BeNull();
        result.MerchantReference.Should().Be("THB260912ABC123");
        result.Amount.Should().Be(900_000m);
        result.IsSuccessful.Should().BeTrue();
        result.ProviderTransactionId.Should().Be("555000111");
    }

    [Fact]
    public void VerifyAndParseCallback_FailedGatewayResponse_IsVerifiedButNotSuccessful()
    {
        var parameters = SignCallback("THB260912ABC123", 900_000m, "24", "02", "555000111");

        var result = CreateGateway().VerifyAndParseCallback(parameters);

        result.IsVerified.Should().BeTrue();
        result.IsSuccessful.Should().BeFalse();
    }

    [Fact]
    public void VerifyAndParseCallback_TamperedSignature_ReturnsInvalidSignature()
    {
        var parameters = SignCallback("THB260912ABC123", 900_000m, "00", "00", "555000111");
        parameters["vnp_Amount"] = "1";

        var result = CreateGateway().VerifyAndParseCallback(parameters);

        result.IsVerified.Should().BeFalse();
        result.Error.Should().Be(PaymentCallbackError.InvalidSignature);
    }

    [Fact]
    public void VerifyAndParseCallback_WrongMerchant_ReturnsInvalidRequest()
    {
        var parameters = SignCallback("THB260912ABC123", 900_000m, "00", "00", "555000111", tmnOverride: "OTHER");

        var result = CreateGateway().VerifyAndParseCallback(parameters);

        result.IsVerified.Should().BeFalse();
        result.Error.Should().Be(PaymentCallbackError.InvalidRequest);
    }

    [Theory]
    [InlineData(PaymentWebhookOutcome.Success, "00")]
    [InlineData(PaymentWebhookOutcome.Duplicate, "02")]
    [InlineData(PaymentWebhookOutcome.NotFound, "01")]
    [InlineData(PaymentWebhookOutcome.InvalidAmount, "04")]
    [InlineData(PaymentWebhookOutcome.InvalidSignature, "97")]
    [InlineData(PaymentWebhookOutcome.InvalidRequest, "99")]
    public void BuildAcknowledgement_MapsOutcomesToProviderCodes(PaymentWebhookOutcome outcome, string code)
    {
        CreateGateway().BuildAcknowledgement(outcome).Code.Should().Be(code);
    }
}
