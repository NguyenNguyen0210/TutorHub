using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
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
        var userId = GetCurrentUserId();
        var query = new GetMyProfileQuery(userId);
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
        var userId = GetCurrentUserId();
        var command = new UpdateMyProfileCommand(
            UserId: userId,
            FullName: request.FullName,
            Phone: request.Phone,
            AvatarUrl: request.AvatarUrl
        );

        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<MyProfileDto>.SuccessResult(result, "Profile updated successfully."));
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
