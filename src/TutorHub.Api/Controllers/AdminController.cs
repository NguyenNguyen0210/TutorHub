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
using TutorHub.Application.Features.Admin.Tutors.ApproveTutor;
using TutorHub.Application.Features.Admin.Tutors.DTOs;
using TutorHub.Application.Features.Admin.Tutors.GetAdminTutors;
using TutorHub.Application.Features.Admin.Tutors.RejectTutor;
using TutorHub.Application.Features.Admin.Tutors.SuspendTutor;
using TutorHub.Application.Features.Admin.Withdrawals.ApproveWithdrawal;
using TutorHub.Application.Features.Admin.Withdrawals.GetAdminWithdrawals;
using TutorHub.Application.Features.Admin.Withdrawals.RejectWithdrawal;
using TutorHub.Application.Features.Reports.DTOs;
using TutorHub.Application.Features.Wallets.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/v1/admin")]
public class AdminController : ControllerBase
{
    private readonly ISender _sender;

    public AdminController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Get paginated list of tutor profiles with status and search filters (Admin only).
    /// </summary>
    [HttpGet("tutors")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AdminTutorDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAdminTutors(
        [FromQuery] TutorProfileStatus? status,
        [FromQuery] string? search,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAdminTutorsQuery(
            Status: status,
            Search: search,
            PageNumber: pageNumber,
            PageSize: pageSize
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<AdminTutorDto>>.SuccessResult(result, "Admin tutors list retrieved successfully."));
    }

    /// <summary>
    /// Approve a pending tutor profile (Admin only).
    /// </summary>
    [HttpPost("tutors/{id:guid}/approve")]
    [ProducesResponseType(typeof(ApiResponse<AdminTutorDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveTutor([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new ApproveTutorCommand(id, adminId);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AdminTutorDto>.SuccessResult(result, "Tutor profile approved successfully."));
    }

    /// <summary>
    /// Reject a tutor profile with a reason (Admin only).
    /// </summary>
    [HttpPost("tutors/{id:guid}/reject")]
    [ProducesResponseType(typeof(ApiResponse<AdminTutorDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectTutor(
        [FromRoute] Guid id,
        [FromBody] AdminReviewRequest request,
        CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new RejectTutorCommand(id, adminId, request.Reason);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AdminTutorDto>.SuccessResult(result, "Tutor profile rejected successfully."));
    }

    /// <summary>
    /// Suspend a tutor profile with a reason (Admin only).
    /// </summary>
    [HttpPost("tutors/{id:guid}/suspend")]
    [ProducesResponseType(typeof(ApiResponse<AdminTutorDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SuspendTutor(
        [FromRoute] Guid id,
        [FromBody] AdminReviewRequest request,
        CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new SuspendTutorCommand(id, adminId, request.Reason);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AdminTutorDto>.SuccessResult(result, "Tutor profile suspended successfully."));
    }

    /// <summary>
    /// Get paginated list of all withdrawal requests in the platform (Admin only).
    /// </summary>
    [HttpGet("withdrawals")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<WithdrawalDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAdminWithdrawals(
        [FromQuery] WithdrawalStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAdminWithdrawalsQuery(
            Status: status,
            PageNumber: pageNumber,
            PageSize: pageSize
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<WithdrawalDto>>.SuccessResult(result, "Admin withdrawals list retrieved successfully."));
    }

    /// <summary>
    /// Approve a pending withdrawal request and mark payout completed (Admin only).
    /// </summary>
    [HttpPost("withdrawals/{id:guid}/approve")]
    [ProducesResponseType(typeof(ApiResponse<WithdrawalDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ApproveWithdrawal([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new ApproveWithdrawalCommand(id, adminId);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<WithdrawalDto>.SuccessResult(result, "Withdrawal approved and completed successfully."));
    }

    /// <summary>
    /// Reject a pending withdrawal request and refund amount to tutor's available balance (Admin only).
    /// </summary>
    [HttpPost("withdrawals/{id:guid}/reject")]
    [ProducesResponseType(typeof(ApiResponse<WithdrawalDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RejectWithdrawal(
        [FromRoute] Guid id,
        [FromBody] RejectWithdrawalRequest request,
        CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new RejectWithdrawalCommand(id, adminId, request.Reason);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<WithdrawalDto>.SuccessResult(result, "Withdrawal rejected and amount refunded to tutor's wallet."));
    }

    /// <summary>
    /// Get paginated list of all dispute reports with status filter (Admin only).
    /// </summary>
    [HttpGet("reports")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ReportSummaryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAdminReports(
        [FromQuery] ReportStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAdminReportsQuery(status, pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<ReportSummaryDto>>.SuccessResult(result, "Admin dispute reports list retrieved successfully."));
    }

    /// <summary>
    /// Get full detail of a dispute report by ID (Admin only).
    /// </summary>
    [HttpGet("reports/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<AdminReportDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAdminReportById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var query = new GetAdminReportByIdQuery(id);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<AdminReportDetailDto>.SuccessResult(result, "Dispute report details retrieved successfully."));
    }

    /// <summary>
    /// Resolve a dispute report with decision and optional financial refund (Admin only).
    /// </summary>
    [HttpPost("reports/{id:guid}/resolve")]
    [ProducesResponseType(typeof(ApiResponse<AdminReportDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
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
        return Ok(ApiResponse<AdminReportDetailDto>.SuccessResult(result, "Dispute report resolved successfully."));
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
