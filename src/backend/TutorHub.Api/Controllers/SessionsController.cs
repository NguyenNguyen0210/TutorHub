using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Application.Features.Sessions.DTOs;
using TutorHub.Application.Features.Sessions.GetMySessions;
using TutorHub.Application.Features.Sessions.ScheduleSession;
using TutorHub.Application.Features.Sessions.SubmitAttendance;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.Controllers;

[ApiController]
[Route("api/v1/sessions")]
public class SessionsController : ControllerBase
{
    private readonly ISender _sender;

    public SessionsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Initial scheduling for an unscheduled session (Student or Tutor participant).
    /// </summary>
    [Authorize]
    [HttpPost("{id:guid}/schedule")]
    [ProducesResponseType(typeof(ApiResponse<SessionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ScheduleSession(
        [FromRoute] Guid id,
        [FromBody] ScheduleSessionRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new ScheduleSessionCommand(
            UserId: userId,
            SessionId: id,
            StartAt: request.StartAt,
            EndAt: request.EndAt
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<SessionDto>.SuccessResult(result, "Session scheduled successfully."));
    }

    /// <summary>
    /// Dual attendance verification (Student or Tutor participant).
    /// Matching attendance automatically completes session and releases progressive escrow payout.
    /// </summary>
    [Authorize]
    [HttpPost("{id:guid}/attendance")]
    [ProducesResponseType(typeof(ApiResponse<SessionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SubmitAttendance(
        [FromRoute] Guid id,
        [FromBody] SubmitAttendanceRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new SubmitAttendanceCommand(
            UserId: userId,
            SessionId: id,
            Outcome: request.Outcome
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<SessionDto>.SuccessResult(result, "Attendance verification submitted successfully."));
    }

    /// <summary>
    /// Get calendar view of sessions for the current user within an optional intersection date range.
    /// </summary>
    [Authorize]
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<SessionCalendarDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMySessions(
        [FromQuery] SessionStatus? status,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        var query = new GetMySessionsQuery(
            UserId: userId,
            Role: role,
            Status: status,
            FromDate: fromDate,
            ToDate: toDate
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<List<SessionCalendarDto>>.SuccessResult(result, "Sessions calendar retrieved successfully."));
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

    private UserRole GetCurrentUserRole()
    {
        var roleClaim = User.FindFirstValue(ClaimTypes.Role);
        if (Enum.TryParse<UserRole>(roleClaim, true, out var role))
        {
            return role;
        }
        throw new UnauthorizedException("User role is invalid or missing from token.");
    }
}
