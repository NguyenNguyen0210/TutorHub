using System.ComponentModel.DataAnnotations;

namespace TutorHub.Infrastructure.Services.VnPay;

public class VnPayOptions
{
    public const string SectionName = "VnPay";

    [Required(ErrorMessage = "VNPay TmnCode is required.")]
    public string TmnCode { get; set; } = default!;

    [Required(ErrorMessage = "VNPay HashSecret is required.")]
    public string HashSecret { get; set; } = default!;

    [Required(ErrorMessage = "VNPay BaseUrl is required."), Url(ErrorMessage = "VNPay BaseUrl must be a valid URL.")]
    public string BaseUrl { get; set; } = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    [Required(ErrorMessage = "VNPay ReturnUrl is required."), Url(ErrorMessage = "VNPay ReturnUrl must be a valid URL.")]
    public string ReturnUrl { get; set; } = default!;

    public string Version { get; set; } = "2.1.0";
    public string Command { get; set; } = "pay";
    public string CurrCode { get; set; } = "VND";
    public string Locale { get; set; } = "vn";
    public string OrderType { get; set; } = "other";

    [Range(1, 60, ErrorMessage = "Payment timeout must be between 1 and 60 minutes.")]
    public int PaymentTimeoutMinutes { get; set; } = 15;
}
