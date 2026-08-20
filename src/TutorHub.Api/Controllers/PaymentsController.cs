using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Payments.CreateVnPayUrl;
using TutorHub.Application.Features.Payments.DTOs;
using TutorHub.Application.Features.Payments.ProcessVnPayIpn;
using TutorHub.Application.Features.Payments.ProcessVnPayReturn;

namespace TutorHub.Api.Controllers;

[ApiController]
[Route("api/v1/payments")]
public class PaymentsController : ControllerBase
{
    private readonly ISender _sender;

    public PaymentsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Generate a secured VNPay Sandbox Payment URL for a holding booking (Student only).
    /// </summary>
    [Authorize(Roles = "Student")]
    [HttpPost("vnpay/create-url")]
    [ProducesResponseType(typeof(ApiResponse<VnPayPaymentUrlDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateVnPayPaymentUrl(
        [FromBody] CreateVnPayUrlRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var ipAddress = GetClientIpAddress();

        var command = new CreateVnPayUrlCommand(
            BookingId: request.BookingId,
            UserId: userId,
            IpAddress: ipAddress
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<VnPayPaymentUrlDto>.SuccessResult(result, "VNPay payment URL generated successfully."));
    }

    /// <summary>
    /// VNPay browser return URL redirect handler (Presentation / Read-Only).
    /// </summary>
    [AllowAnonymous]
    [HttpGet("vnpay/return")]
    [ProducesResponseType(typeof(ApiResponse<VnPayReturnResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ProcessVnPayReturn(CancellationToken cancellationToken)
    {
        var parameters = ExtractQueryParameters();
        var query = new ProcessVnPayReturnQuery(parameters);
        var result = await _sender.Send(query, cancellationToken);

        return Ok(ApiResponse<VnPayReturnResultDto>.SuccessResult(result, result.Message));
    }

    /// <summary>
    /// VNPay Server-to-Server Instant Payment Notification (IPN) Webhook (Atomic and Idempotent Mutation).
    /// </summary>
    [AllowAnonymous]
    [HttpGet("vnpay/ipn")]
    [ProducesResponseType(typeof(VnPayIpnResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ProcessVnPayIpn(CancellationToken cancellationToken)
    {
        var parameters = ExtractQueryParameters();
        var command = new ProcessVnPayIpnCommand(parameters);
        var result = await _sender.Send(command, cancellationToken);

        // VNPay expects exact JSON structure: { "RspCode": "00", "Message": "Confirm Success" }
        return Ok(new
        {
            RspCode = result.RspCode,
            Message = result.Message
        });
    }

    private Dictionary<string, string> ExtractQueryParameters()
    {
        var dictionary = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var key in Request.Query.Keys)
        {
            if (!string.IsNullOrWhiteSpace(key))
            {
                dictionary[key] = Request.Query[key].ToString();
            }
        }
        return dictionary;
    }

    private string GetClientIpAddress()
    {
        // 1. Check for X-Forwarded-For proxy header
        if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
        {
            var ip = forwardedFor.ToString().Split(',')[0].Trim();
            if (!string.IsNullOrWhiteSpace(ip))
            {
                return ip;
            }
        }

        // 2. Check for X-Real-IP proxy header
        if (Request.Headers.TryGetValue("X-Real-IP", out var realIp))
        {
            var ip = realIp.ToString().Trim();
            if (!string.IsNullOrWhiteSpace(ip))
            {
                return ip;
            }
        }

        // 3. Fallback to HttpContext Connection RemoteIpAddress
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedException("User ID is invalid or missing from token.");
        }
        return userId;
    }
}
