using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Reports.DTOs;
using TutorHub.Application.Features.Reviews.CreateEnrollmentReview;
using TutorHub.Application.Features.Reviews.DTOs;
using TutorHub.Application.Features.Reviews.GetEnrollmentReview;
using TutorHub.Application.Features.Reviews.ReplyReview;
using TutorHub.Application.Features.Reviews.ReportReview;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.Controllers;

[ApiController]
public class ReviewsController : ControllerBase
{
    private readonly ISender _sender;

    public ReviewsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Submit a review for a completed enrollment (Student only).
    /// </summary>
    [Authorize]
    [HttpPost("api/v1/enrollments/{enrollmentId:guid}/reviews")]
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateEnrollmentReview(
        [FromRoute] Guid enrollmentId,
        [FromBody] CreateEnrollmentReviewRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new CreateEnrollmentReviewCommand(enrollmentId, userId, request.Rating, request.Comment);
        var result = await _sender.Send(command, cancellationToken);

        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<ReviewDto>.SuccessResult(result, "Review submitted successfully.")
        );
    }

    /// <summary>
    /// Get the review for a specific enrollment (Student owner, Tutor owner, or Admin).
    /// </summary>
    [Authorize]
    [HttpGet("api/v1/enrollments/{enrollmentId:guid}/reviews")]
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEnrollmentReview(
        [FromRoute] Guid enrollmentId,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        var query = new GetEnrollmentReviewQuery(enrollmentId, userId, role);
        var result = await _sender.Send(query, cancellationToken);

        return Ok(ApiResponse<ReviewDto>.SuccessResult(result, "Enrollment review retrieved successfully."));
    }

    /// <summary>
    /// Tutor replies to a student review (Tutor owner only).
    /// </summary>
    [Authorize]
    [HttpPost("api/v1/reviews/{id:guid}/reply")]
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ReplyReview(
        [FromRoute] Guid id,
        [FromBody] ReplyReviewRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new ReplyReviewCommand(id, userId, request.Reply);
        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<ReviewDto>.SuccessResult(result, "Reply submitted successfully."));
    }

    /// <summary>
    /// Report a review for policy violation (Authenticated users).
    /// </summary>
    [Authorize]
    [HttpPost("api/v1/reviews/{id:guid}/report")]
    [ProducesResponseType(typeof(ApiResponse<ReportSummaryDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ReportReview(
        [FromRoute] Guid id,
        [FromBody] ReportReviewRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new ReportReviewCommand(id, userId, request.Description, request.EvidenceUrl);
        var result = await _sender.Send(command, cancellationToken);

        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<ReportSummaryDto>.SuccessResult(result, "Review report submitted successfully and is awaiting admin review.")
        );
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
        var roleClaim = User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("role");
        if (string.IsNullOrWhiteSpace(roleClaim) || !Enum.TryParse<UserRole>(roleClaim, true, out var role))
        {
            throw new UnauthorizedException("User role is invalid or missing from token.");
        }
        return role;
    }
}
