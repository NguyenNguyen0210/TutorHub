using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TutorHub.Api.Configuration;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Auth.ChangePassword;
using TutorHub.Application.Features.Auth.DTOs;
using TutorHub.Application.Features.Auth.ExternalLogin;
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
    [EnableRateLimiting(RateLimitingPolicies.AuthStrict)]
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
    [EnableRateLimiting(RateLimitingPolicies.AuthStrict)]
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
    [EnableRateLimiting(RateLimitingPolicies.AuthStrict)]
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
        var command = new ChangePasswordCommand(request.CurrentPassword, request.NewPassword);
        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<bool>.SuccessResult(result, "Password changed successfully."));
    }

    /// <summary>
    /// Which external sign-in buttons the client should render.
    /// Returns an empty list when no provider has credentials, so the UI hides the
    /// buttons instead of showing a dead one.
    /// </summary>
    [HttpGet("oauth/providers")]
    [ProducesResponseType(typeof(ApiResponse<ExternalProvidersDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetExternalProviders(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetExternalProvidersQuery(), cancellationToken);
        return Ok(ApiResponse<ExternalProvidersDto>.SuccessResult(result, "External sign-in providers retrieved."));
    }

    /// <summary>
    /// Begin an external sign-in. Returns the provider URL to navigate to plus the
    /// <c>state</c> the callback must echo back.
    /// </summary>
    [HttpGet("oauth/{provider}/start")]
    [EnableRateLimiting(RateLimitingPolicies.AuthStrict)]
    [ProducesResponseType(typeof(ApiResponse<ExternalAuthorizeUrlDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> StartExternalLogin([FromRoute] string provider, [FromQuery] string? returnUrl, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetExternalAuthorizeUrlQuery(provider, returnUrl), cancellationToken);
        return Ok(ApiResponse<ExternalAuthorizeUrlDto>.SuccessResult(result, "External sign-in started."));
    }

    /// <summary>
    /// Finish an external sign-in.
    /// POST-only: the authorization code then never reaches a URL, browser history,
    /// or an access log. There is deliberately no GET counterpart.
    /// </summary>
    [HttpPost("oauth/{provider}/callback")]
    [EnableRateLimiting(RateLimitingPolicies.AuthStrict)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CompleteExternalLogin(
        [FromRoute] string provider,
        [FromBody] CompleteExternalLoginRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CompleteExternalLoginCommand(provider, request.Code, request.State, request.ReturnUrl);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AuthResponseDto>.SuccessResult(result, "Logged in successfully."));
    }

    /// <summary>
    /// Get information about the currently authenticated user.
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<GetMeResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMe(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetMeQuery(), cancellationToken);
        return Ok(ApiResponse<GetMeResponseDto>.SuccessResult(result, "User profile retrieved successfully."));
    }
}
