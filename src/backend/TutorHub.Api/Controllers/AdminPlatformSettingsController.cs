using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.PlatformSettings.Commands.AdminUpdatePlatformFee;
using TutorHub.Application.Features.PlatformSettings.Commands.AdminUpsertPlatformSetting;
using TutorHub.Application.Features.PlatformSettings.DTOs;
using TutorHub.Application.Features.PlatformSettings.Queries.AdminGetPlatformRevenueAnalytics;
using TutorHub.Application.Features.PlatformSettings.Queries.AdminGetPlatformSettings;

namespace TutorHub.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/v1/admin")]
public class AdminPlatformSettingsController : ControllerBase
{
    private readonly ISender _sender;

    public AdminPlatformSettingsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Admin: List platform settings with version history.
    /// </summary>
    [HttpGet("platform-settings")]
    [ProducesResponseType(typeof(ApiResponse<List<PlatformSettingDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPlatformSettings(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new AdminGetPlatformSettingsQuery(), cancellationToken);
        return Ok(ApiResponse<List<PlatformSettingDto>>.SuccessResult(result, "Platform settings retrieved successfully."));
    }

    /// <summary>
    /// Admin: Update the platform fee rate (monotonically versioned, immutable snapshot on future enrollments).
    /// </summary>
    [HttpPut("platform-settings/fee-rate")]
    [ProducesResponseType(typeof(ApiResponse<PlatformSettingDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdatePlatformFeeRate(
        [FromBody] UpdatePlatformFeeRequest request,
        CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new AdminUpdatePlatformFeeCommand(
            NewFeeRate: request.NewFeeRate,
            AdminUserId: adminId,
            Reason: request.Reason
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<PlatformSettingDto>.SuccessResult(result, "Platform fee rate updated successfully."));
    }

    /// <summary>
    /// Admin: Upsert a generic versioned platform policy (F-17 plumbing).
    /// Allowed keys: VerificationWindowHours, ReviewWindowDays, CancellationPolicy,
    /// RefundRules, WithdrawalRules. Values stay opaque until D-01..D-08 decide semantics.
    /// </summary>
    [HttpPut("platform-settings/{key}")]
    [ProducesResponseType(typeof(ApiResponse<PlatformSettingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpsertPlatformSetting(
        [FromRoute] string key,
        [FromBody] UpsertPlatformSettingRequest request,
        CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new AdminUpsertPlatformSettingCommand(
            Key: key,
            Value: request.Value,
            AdminUserId: adminId,
            Reason: request.Reason
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<PlatformSettingDto>.SuccessResult(result, "Platform setting updated successfully."));
    }

    /// <summary>
    /// Admin: Platform revenue analytics with net dispute fee reconciliation.
    /// </summary>
    [HttpGet("analytics/platform-revenue")]
    [ProducesResponseType(typeof(ApiResponse<PlatformRevenueAnalyticsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPlatformRevenueAnalytics(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new AdminGetPlatformRevenueAnalyticsQuery(), cancellationToken);
        return Ok(ApiResponse<PlatformRevenueAnalyticsDto>.SuccessResult(result, "Platform revenue analytics retrieved successfully."));
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

public record UpdatePlatformFeeRequest(
    decimal NewFeeRate,
    string Reason
);

public record UpsertPlatformSettingRequest(
    string Value,
    string Reason
);
