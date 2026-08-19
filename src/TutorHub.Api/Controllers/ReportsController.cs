using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Reports.CreateReport;
using TutorHub.Application.Features.Reports.DTOs;
using TutorHub.Application.Features.Reports.GetMyReports;

namespace TutorHub.Api.Controllers;

[ApiController]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly ISender _sender;

    public ReportsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Submit a dispute report for a specific booking (Booking participant only).
    /// </summary>
    [HttpPost("api/v1/bookings/{id:guid}/reports")]
    [ProducesResponseType(typeof(ApiResponse<ReportSummaryDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateReport(
        [FromRoute] Guid id,
        [FromBody] CreateReportRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new CreateReportCommand(
            BookingId: id,
            UserId: userId,
            Description: request.Description,
            EvidenceUrl: request.EvidenceUrl
        );

        var result = await _sender.Send(command, cancellationToken);

        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<ReportSummaryDto>.SuccessResult(result, "Dispute report submitted successfully and is awaiting admin review.")
        );
    }

    /// <summary>
    /// Get paginated list of dispute reports submitted by the authenticated user.
    /// </summary>
    [HttpGet("api/v1/reports/me")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<UserReportDetailDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyReports(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var query = new GetMyReportsQuery(userId, pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);

        return Ok(ApiResponse<PagedResult<UserReportDetailDto>>.SuccessResult(result, "Your dispute reports retrieved successfully."));
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
