using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Application.Features.Sessions.DTOs;
using TutorHub.Application.Features.Sessions.GetMySessions;
using TutorHub.Application.Features.Sessions.Reschedule.AcceptReschedule;
using TutorHub.Application.Features.Sessions.Reschedule.DTOs;
using TutorHub.Application.Features.Sessions.Reschedule.GetRescheduleRequests;
using TutorHub.Application.Features.Sessions.Reschedule.ProposeReschedule;
using TutorHub.Application.Features.Sessions.Reschedule.RejectReschedule;
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

    /// <summary>
    /// Propose a reschedule for an agreed scheduled session (Tutor only - FR-SESSION-004).
    /// Does not mutate the session schedule until accepted by the Student.
    /// </summary>
    [Authorize]
    [HttpPost("{id:guid}/reschedule-requests")]
    [ProducesResponseType(typeof(ApiResponse<SessionRescheduleRequestDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ProposeReschedule(
        [FromRoute] Guid id,
        [FromBody] ProposeRescheduleRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new ProposeSessionRescheduleCommand(
            UserId: userId,
            SessionId: id,
            ProposedStartAt: request.ProposedStartAt,
            ProposedEndAt: request.ProposedEndAt,
            Reason: request.Reason
        );

        var result = await _sender.Send(command, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<SessionRescheduleRequestDto>.SuccessResult(result, "Reschedule proposal created successfully."));
    }

    /// <summary>
    /// Accept a pending reschedule proposal (Student only - FR-SESSION-005).
    /// Atomically updates session schedule, emits outbox event, and records permanent audit log.
    /// </summary>
    [Authorize]
    [HttpPost("{id:guid}/reschedule-requests/{requestId:guid}/accept")]
    [ProducesResponseType(typeof(ApiResponse<SessionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AcceptReschedule(
        [FromRoute] Guid id,
        [FromRoute] Guid requestId,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new AcceptSessionRescheduleCommand(
            UserId: userId,
            SessionId: id,
            RequestId: requestId
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<SessionDto>.SuccessResult(result, "Session rescheduled successfully."));
    }

    /// <summary>
    /// Reject a pending reschedule proposal (Student only - FR-SESSION-005).
    /// Marks the proposal as rejected while leaving the session schedule untouched.
    /// </summary>
    [Authorize]
    [HttpPost("{id:guid}/reschedule-requests/{requestId:guid}/reject")]
    [ProducesResponseType(typeof(ApiResponse<SessionRescheduleRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RejectReschedule(
        [FromRoute] Guid id,
        [FromRoute] Guid requestId,
        [FromBody] RejectRescheduleRequest? request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new RejectSessionRescheduleCommand(
            UserId: userId,
            SessionId: id,
            RequestId: requestId,
            RejectionReason: request?.Reason
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<SessionRescheduleRequestDto>.SuccessResult(result, "Reschedule proposal rejected."));
    }

    /// <summary>
    /// Get reschedule proposal history for a session (Student or Tutor participant).
    /// </summary>
    [Authorize]
    [HttpGet("{id:guid}/reschedule-requests")]
    [ProducesResponseType(typeof(ApiResponse<List<SessionRescheduleRequestDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRescheduleRequests(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var query = new GetSessionRescheduleRequestsQuery(
            UserId: userId,
            SessionId: id
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<List<SessionRescheduleRequestDto>>.SuccessResult(result, "Reschedule requests retrieved successfully."));
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
