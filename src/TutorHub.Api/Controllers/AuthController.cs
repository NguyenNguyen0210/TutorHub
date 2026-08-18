using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Auth.ChangePassword;
using TutorHub.Application.Features.Auth.DTOs;
using TutorHub.Application.Features.Auth.GetMe;
using TutorHub.Application.Features.Auth.Login;
using TutorHub.Application.Features.Auth.Logout;
using TutorHub.Application.Features.Auth.RefreshToken;
using TutorHub.Application.Features.Auth.Register;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly ISender _sender;

    public AuthController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Register a new student or tutor account.
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<RegisterResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<UserRole>(request.Role, true, out var role))
        {
            throw new BadRequestException("Role must be Student or Tutor.");
        }

        var command = new RegisterCommand(request.Email, request.Password, request.FullName, request.Phone, role);
        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<RegisterResponseDto>.SuccessResult(result, "Account registered successfully."));
    }

    /// <summary>
    /// Log in with email and password.
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var command = new LoginCommand(request.Email, request.Password);
        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<AuthResponseDto>.SuccessResult(result, "Logged in successfully."));
    }

    /// <summary>
    /// Refresh an expired access token using a valid refresh token (Rotation enabled).
    /// </summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ApiResponse<RefreshTokenResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var command = new RefreshTokenCommand(request.RefreshToken);
        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<RefreshTokenResponseDto>.SuccessResult(result, "Tokens refreshed successfully."));
    }

    /// <summary>
    /// Log out and revoke the specified refresh token.
    /// </summary>
    [Authorize]
    [HttpPost("logout")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request, CancellationToken cancellationToken)
    {
        var command = new LogoutCommand(request.RefreshToken);
        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<bool>.SuccessResult(result, "Logged out successfully."));
    }

    /// <summary>
    /// Change the current user's password and revoke active sessions.
    /// </summary>
    [Authorize]
    [HttpPost("change-password")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedException("User ID is invalid or missing from token.");
        }

        var command = new ChangePasswordCommand(userId, request.CurrentPassword, request.NewPassword);
        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<bool>.SuccessResult(result, "Password changed successfully."));
    }

    /// <summary>
    /// Get information about the currently authenticated user.
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<RegisterResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMe(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedException("User ID is invalid or missing from token.");
        }

        var result = await _sender.Send(new GetMeQuery(userId), cancellationToken);
        return Ok(ApiResponse<RegisterResponseDto>.SuccessResult(result, "User profile retrieved successfully."));
    }
}
