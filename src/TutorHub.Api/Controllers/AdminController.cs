using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Admin.Tutors.ApproveTutor;
using TutorHub.Application.Features.Admin.Tutors.DTOs;
using TutorHub.Application.Features.Admin.Tutors.GetAdminTutors;
using TutorHub.Application.Features.Admin.Tutors.RejectTutor;
using TutorHub.Application.Features.Admin.Tutors.SuspendTutor;
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
        return Ok(ApiResponse<PagedResult<AdminTutorDto>>.SuccessResult(result));
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
