using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Admin.Reports.DTOs;
using TutorHub.Application.Features.Admin.Reports.GetAdminReportById;
using TutorHub.Application.Features.Admin.Reports.GetAdminReports;
using TutorHub.Application.Features.Admin.Reports.ResolveReport;
using TutorHub.Application.Features.Reports.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/v1/admin/trust-reports")]
public class AdminTrustReportsController : ControllerBase
{
    private readonly ISender _sender;

    public AdminTrustReportsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Admin: List Trust &amp; Safety reports with optional status filter (FR-TRUST-003).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ReportSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReports(
        [FromQuery] ReportStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAdminReportsQuery(status, pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<ReportSummaryDto>>.SuccessResult(result, "Trust & Safety reports retrieved successfully."));
    }

    /// <summary>
    /// Admin: Get Trust &amp; Safety report detail by ID (FR-TRUST-003).
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<AdminReportDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReportById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var query = new GetAdminReportByIdQuery(id);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<AdminReportDetailDto>.SuccessResult(result, "Trust & Safety report details retrieved successfully."));
    }

    /// <summary>
    /// Admin: Enforce Trust &amp; Safety moderation action on a report (FR-TRUST-004: Warn, Suspend, Ban, RemoveContent, Dismiss).
    /// </summary>
    [HttpPost("{id:guid}/resolve")]
    [ProducesResponseType(typeof(ApiResponse<AdminReportDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ResolveReport(
        [FromRoute] Guid id,
        [FromBody] ResolveReportRequest request,
        CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new ResolveReportCommand(id, adminId, request.Decision, request.Resolution);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AdminReportDetailDto>.SuccessResult(result, "Trust & Safety report resolved with moderation action successfully."));
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
