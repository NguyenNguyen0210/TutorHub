using MediatR;
using TutorHub.Application.Features.Auth.DTOs;

namespace TutorHub.Application.Features.Auth.ExternalLogin;

/// <summary>
/// Completes an external sign-in. POST-only by design: the authorization code then
/// never appears in a URL, browser history, or an access log.
/// </summary>
public record CompleteExternalLoginCommand(
    string Provider,
    string Code,
    string State,
    string? ReturnUrl) : IRequest<AuthResponseDto>;
