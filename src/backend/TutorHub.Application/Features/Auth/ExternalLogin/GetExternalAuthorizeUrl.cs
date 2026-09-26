using MediatR;

namespace TutorHub.Application.Features.Auth.ExternalLogin;

/// <summary>
/// Begins an external sign-in. The response carries a URL to send the browser to
/// plus the <c>state</c> the callback will have to echo back.
/// </summary>
public record GetExternalAuthorizeUrlQuery(string Provider, string? ReturnUrl = null)
    : IRequest<ExternalAuthorizeUrlDto>;

public record ExternalAuthorizeUrlDto(string AuthorizeUrl, string State, string Provider);
