namespace TutorHub.Infrastructure.Services.VnPay;

public class VnPayOptions
{
    public const string SectionName = "VnPay";

    public string TmnCode { get; set; } = "TUTORHUB";
    public string HashSecret { get; set; } = default!;
    public string BaseUrl { get; set; } = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    public string ReturnUrl { get; set; } = "http://localhost:5000/api/v1/payments/vnpay/return";
    public string Version { get; set; } = "2.1.0";
    public string Command { get; set; } = "pay";
    public string CurrCode { get; set; } = "VND";
    public string Locale { get; set; } = "vn";
    public string OrderType { get; set; } = "other";
    public int PaymentTimeoutMinutes { get; set; } = 15;
}
