using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Features.Auth.ChangePassword;
using TutorHub.Application.Features.Auth.GetMe;
using TutorHub.Application.Features.Auth.Login;
using TutorHub.Application.Features.Auth.Models;
using TutorHub.Application.Features.Auth.RefreshToken;
using TutorHub.Application.Features.Auth.Register;
using TutorHub.Application.Features.Auth.RevokeToken;
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

    public record RegisterRequest(string Email, string Password, string FullName, string? Phone, string Role);
    public record LoginRequest(string Email, string Password);
    public record RefreshTokenRequest(string AccessToken, string RefreshToken);
    public record LogoutRequest(string RefreshToken);
    public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

    /// <summary>
    /// Register a new student or tutor account.
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<UserRole>(request.Role, true, out var role))
        {
            return BadRequest(new { error = new { code = "INVALID_ROLE", message = "Role must be Student or Tutor." } });
        }

        var command = new RegisterCommand(request.Email, request.Password, request.FullName, request.Phone, role);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Log in with email and password.
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var command = new LoginCommand(request.Email, request.Password);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Refresh an expired access token using a valid refresh token (Rotation enabled).
    /// </summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var command = new RefreshTokenCommand(request.AccessToken, request.RefreshToken);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Log out and revoke the specified refresh token.
    /// </summary>
    [Authorize]
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request, CancellationToken cancellationToken)
    {
        var command = new RevokeTokenCommand(request.RefreshToken);
        await _sender.Send(command, cancellationToken);
        return Ok(new { message = "Logged out successfully." });
    }

    /// <summary>
    /// Change the current user's password and revoke active sessions.
    /// </summary>
    [Authorize]
    [HttpPost("change-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var command = new ChangePasswordCommand(userId, request.CurrentPassword, request.NewPassword);
        await _sender.Send(command, cancellationToken);

        return Ok(new { message = "Password changed successfully." });
    }

    /// <summary>
    /// Get information about the currently authenticated user.
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMe(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var result = await _sender.Send(new GetMeQuery(userId), cancellationToken);
        return Ok(result);
    }
}
