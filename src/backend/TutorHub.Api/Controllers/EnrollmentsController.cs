using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Application.Features.Enrollments.CancelEnrollment;
using TutorHub.Application.Features.Enrollments.DTOs;
using TutorHub.Application.Features.Enrollments.GetEnrollmentById;
using TutorHub.Application.Features.Enrollments.GetMyEnrollments;
using TutorHub.Application.Features.Enrollments.TutorCannotContinue;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.Controllers;

[ApiController]
[Route("api/v1/enrollments")]
public class EnrollmentsController : ControllerBase
{
    private readonly ISender _sender;

    public EnrollmentsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Get paginated list of learning contracts (enrollments) for the authenticated Student or Tutor.
    /// </summary>
    [Authorize]
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<EnrollmentSummaryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyEnrollments(
        [FromQuery] EnrollmentStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        var query = new GetMyEnrollmentsQuery(
            UserId: userId,
            Role: role,
            Status: status,
            PageNumber: pageNumber,
            PageSize: pageSize
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<EnrollmentSummaryDto>>.SuccessResult(result, "Enrollments list retrieved successfully."));
    }

    /// <summary>
    /// Get detailed learning contract information including all sessions by ID (Participants or Admin).
    /// </summary>
    [Authorize]
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<EnrollmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEnrollmentById(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        var query = new GetEnrollmentByIdQuery(userId, role, id);
        var result = await _sender.Send(query, cancellationToken);

        return Ok(ApiResponse<EnrollmentDto>.SuccessResult(result, "Enrollment details retrieved successfully."));
    }

    /// <summary>
    /// Student requests cancellation of an active learning contract.
    /// Uncompleted sessions are cancelled and refunded from Escrow. Completed sessions are preserved.
    /// </summary>
    [Authorize]
    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(ApiResponse<EnrollmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CancelEnrollment(
        [FromRoute] Guid id,
        [FromBody] CancelEnrollmentRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new CancelEnrollmentCommand(userId, id, request.Reason);
        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<EnrollmentDto>.SuccessResult(result, "Enrollment cancelled successfully."));
    }

    /// <summary>
    /// Tutor declares inability to continue teaching the learning contract.
    /// Uncompleted sessions are cancelled and refunded from Escrow. Completed sessions are preserved.
    /// </summary>
    [Authorize]
    [HttpPost("{id:guid}/tutor-cannot-continue")]
    [ProducesResponseType(typeof(ApiResponse<EnrollmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> TutorCannotContinue(
        [FromRoute] Guid id,
        [FromBody] TutorCannotContinueRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new TutorCannotContinueCommand(userId, id, request.Reason);
        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<EnrollmentDto>.SuccessResult(result, "Tutor inability to continue processed successfully."));
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
