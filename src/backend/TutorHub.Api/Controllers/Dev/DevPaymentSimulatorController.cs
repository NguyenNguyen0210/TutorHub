using System.Globalization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Bookings;
using TutorHub.Application.Features.Payments.HandlePaymentWebhook;
using TutorHub.Infrastructure.Services.VnPay;

namespace TutorHub.Api.Controllers.Dev;

public record SimulateVnPayIpnRequest(Guid BookingId, bool Success = true);

public record SimulatedPaymentDto(
    string TxnRef,
    decimal Amount,
    bool Success,
    string AckCode,
    string AckMessage,
    string BookingStatus,
    Guid? EnrollmentId);

/// <summary>
/// P0 dev-tooling: a local stand-in for the VNPay server-to-server IPN.
///
/// Locally VNPay cannot reach the API (the IPN is an outbound call from VNPay to a
/// public URL) and the browser Return URL is deliberately read-only, so without this
/// endpoint a frontend cannot walk the checkout → enrollment → session pipeline at all.
///
/// It does NOT shortcut any business rule: it signs a real VNPay-shaped callback with
/// the configured hash secret and dispatches the production
/// <see cref="HandlePaymentWebhookCommand"/>, so escrow funding, enrollment activation,
/// session allocation and idempotency behave exactly as they do for a live IPN.
///
/// Exposed in Development only — see <see cref="IDevelopmentOnlyEndpoint"/>.
/// </summary>
[ApiController]
[Route("api/v1/dev/payments")]
[AllowAnonymous]
public class DevPaymentSimulatorController : ControllerBase, IDevelopmentOnlyEndpoint
{
    private readonly ISender _sender;
    private readonly IAppDbContext _context;
    private readonly VnPayOptions _vnPayOptions;
    private readonly IHostEnvironment _environment;

    public DevPaymentSimulatorController(
        ISender sender,
        IAppDbContext context,
        IOptions<VnPayOptions> vnPayOptions,
        IHostEnvironment environment)
    {
        _sender = sender;
        _context = context;
        _vnPayOptions = vnPayOptions.Value;
        _environment = environment;
    }

    /// <summary>
    /// Dispatches a signed VNPay IPN for a holding booking as if the gateway had just
    /// confirmed (or declined) the payment.
    /// </summary>
    [HttpPost("simulate-ipn")]
    [ProducesResponseType(typeof(ApiResponse<SimulatedPaymentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SimulateIpn(
        [FromBody] SimulateVnPayIpnRequest request,
        CancellationToken cancellationToken)
    {
        // Belt and braces: the controller type is not registered outside Development.
        if (!_environment.IsDevelopment())
        {
            throw new NotFoundException(nameof(SimulateVnPayIpnRequest), request.BookingId);
        }

        var booking = await _context.Bookings
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);

        if (booking == null)
        {
            throw new NotFoundException(nameof(booking), request.BookingId);
        }

        // The merchant reference is minted by POST /payments/vnpay/create-url.
        var paymentTransaction = await _context.GetPaymentTransactionAsync(request.BookingId, cancellationToken);

        if (paymentTransaction?.PaymentGatewayRef == null)
        {
            throw new BadRequestException(
                "This booking has no gateway attempt yet. Call POST /api/v1/payments/vnpay/create-url first.");
        }

        // A successful IPN appends "|{providerTxnNo}" to the reference; the callback must
        // carry the original merchant reference so the handler routes it correctly.
        var txnRef = paymentTransaction.PaymentGatewayRef.Split('|')[0];

        var parameters = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["vnp_TmnCode"] = _vnPayOptions.TmnCode,
            ["vnp_CurrCode"] = _vnPayOptions.CurrCode,
            ["vnp_TxnRef"] = txnRef,
            // Deterministic per booking so re-running the simulator stays idempotent.
            ["vnp_TransactionNo"] = BitConverter
                .ToUInt32(paymentTransaction.BookingId.ToByteArray(), 0)
                .ToString(CultureInfo.InvariantCulture),
            ["vnp_Amount"] = (paymentTransaction.Amount * 100m).ToString(CultureInfo.InvariantCulture),
            ["vnp_ResponseCode"] = request.Success ? "00" : "24",
            ["vnp_TransactionStatus"] = request.Success ? "00" : "02"
        };

        var vnPay = new VnPayLibrary();
        foreach (var (key, value) in parameters)
        {
            vnPay.AddResponseData(key, value);
        }

        parameters["vnp_SecureHash"] = vnPay.CreateResponseSignature(_vnPayOptions.HashSecret);

        var ack = await _sender.Send(new HandlePaymentWebhookCommand(parameters), cancellationToken);

        var updatedBooking = await _context.Bookings
            .AsNoTracking()
            .FirstAsync(b => b.Id == request.BookingId, cancellationToken);

        var enrollmentId = await _context.Enrollments
            .AsNoTracking()
            .Where(e => e.BookingId == request.BookingId)
            .Select(e => (Guid?)e.Id)
            .FirstOrDefaultAsync(cancellationToken);

        return Ok(ApiResponse<SimulatedPaymentDto>.SuccessResult(
            new SimulatedPaymentDto(
                TxnRef: txnRef,
                Amount: paymentTransaction.Amount,
                Success: request.Success,
                AckCode: ack.Code,
                AckMessage: ack.Message,
                BookingStatus: updatedBooking.Status.ToString(),
                EnrollmentId: enrollmentId),
            "Simulated VNPay IPN dispatched through the production webhook handler."));
    }
}
