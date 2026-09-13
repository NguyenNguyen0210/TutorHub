using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Users.DTOs;
using TutorHub.Application.Features.Users.GetMyProfile;
using TutorHub.Application.Features.Users.UpdateMyProfile;

namespace TutorHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/users")]
public class UsersController : ControllerBase
{
    private readonly ISender _sender;

    public UsersController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Get the complete profile information of the currently authenticated user.
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<MyProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyProfile(CancellationToken cancellationToken)
    {
        var query = new GetMyProfileQuery();
        var result = await _sender.Send(query, cancellationToken);

        return Ok(ApiResponse<MyProfileDto>.SuccessResult(result, "Profile retrieved successfully."));
    }

    /// <summary>
    /// Update personal profile information (FullName, Phone, AvatarUrl) for the currently authenticated user.
    /// </summary>
    [HttpPut("me")]
    [ProducesResponseType(typeof(ApiResponse<MyProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateMyProfile(
        [FromBody] UpdateUserProfileRequest request,
        CancellationToken cancellationToken)
    {
        var command = new UpdateMyProfileCommand(
            FullName: request.FullName,
            Phone: request.Phone,
            AvatarUrl: request.AvatarUrl
        );

        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<MyProfileDto>.SuccessResult(result, "Profile updated successfully."));
    }

    /// <summary>
    /// Report another user for conduct, harassment, or platform violations (FR-TRUST-001).
    /// </summary>
    [HttpPost("{id:guid}/report")]
    [ProducesResponseType(typeof(ApiResponse<TutorHub.Application.Features.Reports.DTOs.ReportSummaryDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReportUser(
        [FromRoute] Guid id,
        [FromBody] ReportUserRequest request,
        CancellationToken cancellationToken)
    {
        var command = new TutorHub.Application.Features.Reports.ReportUser.ReportUserCommand(
            TargetUserId: id,
            Reason: request.Reason,
            EvidenceUrl: request.EvidenceUrl
        );

        var result = await _sender.Send(command, cancellationToken);

        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<TutorHub.Application.Features.Reports.DTOs.ReportSummaryDto>.SuccessResult(result, "User reported successfully. Our Trust & Safety team will investigate.")
        );
    }
}

public record ReportUserRequest(
    string Reason,
    string? EvidenceUrl = null
);
