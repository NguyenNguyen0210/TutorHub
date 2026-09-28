using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Application.Features.Sessions.DTOs;
using TutorHub.Application.Features.Sessions.GetMySessions;
using TutorHub.Application.Features.Sessions.GetSessionById;
using TutorHub.Application.Features.LearningRecords.CreateLearningRecord;
using TutorHub.Application.Features.LearningRecords.DTOs;
using TutorHub.Application.Features.LearningRecords.GetLearningRecord;
using TutorHub.Application.Features.Sessions.CancelSession;
using TutorHub.Application.Features.Sessions.ScheduleSession;
using TutorHub.Application.Features.Sessions.ScheduleSessionsBatch;
using TutorHub.Application.Features.Sessions.ReportSessionIssue;
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
    /// Tutor-direct scheduling for a session (Unscheduled → Schedule, Scheduled → direct Reschedule).
    /// Only the session's tutor may call; minimum-notice rule (default 24h) applies.
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
        var command = new ScheduleSessionCommand(
            SessionId: id,
            StartAt: request.StartAt,
            EndAt: request.EndAt
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<SessionDto>.SuccessResult(result, "Session scheduled successfully."));
    }

    /// <summary>Tutor bulk-schedules unscheduled sessions atomically.</summary>
    [Authorize(Roles = "Tutor")]
    [HttpPost("schedule-batch")]
    [ProducesResponseType(typeof(ApiResponse<List<SessionDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ScheduleBatch(
        [FromBody] ScheduleSessionsBatchCommand command,
        CancellationToken cancellationToken)
    {
        if (command.Items is null)
        {
            return BadRequest(ApiResponse<List<SessionDto>>.FailureResult(
                "Validation failed. One or more validation errors occurred.",
                "Items is required."));
        }

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<List<SessionDto>>.SuccessResult(result, "Sessions scheduled successfully."));
    }

    [Authorize]
    [HttpPost("{id:guid}/report-issue")]
    [ProducesResponseType(typeof(ApiResponse<SessionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReportSessionIssue(Guid id, [FromBody] ReportSessionIssueRequest request)
    {
        var result = await _sender.Send(new ReportSessionIssueCommand(id, request.Reason, request.Description));
        return Ok(ApiResponse<SessionDto>.SuccessResult(result, "Issue reported successfully. Payout has been frozen pending admin review."));
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
        var query = new GetMySessionsQuery(
            Status: status,
            FromDate: fromDate,
            ToDate: toDate
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<List<SessionCalendarDto>>.SuccessResult(result, "Sessions calendar retrieved successfully."));
    }

    /// <summary>
    /// Get a single session by id (Admin, or Student/Tutor of the owning enrollment).
    /// </summary>
    [Authorize]
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<SessionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSessionById(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var query = new GetSessionByIdQuery(
            SessionId: id
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<SessionDto>.SuccessResult(result, "Session retrieved successfully."));
    }

    /// <summary>
    /// Cancel a single session (Student or Tutor participant).
    /// Only Unscheduled or future Scheduled sessions; cancelling a Scheduled session
    /// requires minimum notice (default 24h). Refund is credited directly to the
    /// Student Wallet with a Succeeded StudentRefund record.
    /// </summary>
    [Authorize]
    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(ApiResponse<SessionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CancelSession(
        [FromRoute] Guid id,
        [FromBody] CancelSessionRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CancelSessionCommand(
            SessionId: id,
            Reason: request.Reason
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<SessionDto>.SuccessResult(result, "Session cancelled successfully."));
    }

    /// <summary>
    /// Write the learning record for a completed session (Tutor only, F-14, write-once).
    /// </summary>
    [Authorize(Roles = "Tutor")]
    [HttpPost("{id:guid}/learning-record")]
    [ProducesResponseType(typeof(ApiResponse<LearningRecordDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateLearningRecord(
        [FromRoute] Guid id,
        [FromBody] CreateLearningRecordRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CreateLearningRecordCommand(
            SessionId: id,
            Content: request.Content
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<LearningRecordDto>.SuccessResult(result, "Learning record created successfully."));
    }

    /// <summary>
    /// Get the learning record of a session (Student or Tutor participant, read-only).
    /// </summary>
    [Authorize]
    [HttpGet("{id:guid}/learning-record")]
    [ProducesResponseType(typeof(ApiResponse<LearningRecordDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLearningRecord(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var query = new GetLearningRecordQuery(
            SessionId: id
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<LearningRecordDto?>.SuccessResult(result, "Learning record retrieved successfully."));
    }

    public record CreateLearningRecordRequest(
        string Content
    );

    public record ReportSessionIssueRequest(string Reason, string Description);
}
