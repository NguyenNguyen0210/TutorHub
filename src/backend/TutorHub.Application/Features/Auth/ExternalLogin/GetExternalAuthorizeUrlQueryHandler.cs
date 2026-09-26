using MediatR;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Common.Security;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Auth.ExternalLogin;

/// <summary>
/// Shared provider selection for the external sign-in handlers.
/// </summary>
public static class ExternalAuthProviderResolver
{
    /// <summary>
    /// Finds the requested provider. An unknown name is a client error, not a 500:
    /// the caller sent something the API does not implement.
    /// </summary>
    public static IExternalAuthProvider Resolve(
        IEnumerable<IExternalAuthProvider> providers,
        string? providerName)
    {
        var match = providers.FirstOrDefault(p =>
            string.Equals(p.Provider.ToString(), providerName?.Trim(), StringComparison.OrdinalIgnoreCase));

        return match ?? throw new BadRequestException(
            $"'{providerName}' is not a supported sign-in provider.");
    }
}

/// <summary>
/// Mints a fresh <c>state</c> + PKCE verifier and hands back the provider's
/// authorization URL. Nothing about the user is decided here.
/// </summary>
public class GetExternalAuthorizeUrlQueryHandler
    : IRequestHandler<GetExternalAuthorizeUrlQuery, ExternalAuthorizeUrlDto>
{
    private readonly IEnumerable<IExternalAuthProvider> _providers;
    private readonly IExternalAuthStateStore _stateStore;
    private readonly ExternalAuthOptions _options;

    public GetExternalAuthorizeUrlQueryHandler(
        IEnumerable<IExternalAuthProvider> providers,
        IExternalAuthStateStore stateStore,
        IOptions<ExternalAuthOptions> options)
    {
        _providers = providers;
        _stateStore = stateStore;
        _options = options.Value;
    }

    public Task<ExternalAuthorizeUrlDto> Handle(GetExternalAuthorizeUrlQuery request, CancellationToken cancellationToken)
    {
        var provider = ExternalAuthProviderResolver.Resolve(_providers, request.Provider);

        if (!provider.IsConfigured)
        {
            // 400, not 500: this is a deployment gap, and the message says so.
            throw new BadRequestException(
                $"{provider.Provider} sign-in is not configured on this server. " +
                "An administrator must set the provider's client id and secret.");
        }

        if (string.IsNullOrWhiteSpace(_options.RedirectUri))
        {
            throw new BadRequestException("External sign-in is missing its redirect URI configuration.");
        }

        var clientId = provider.Provider == ExternalAuthProvider.Facebook
            ? _options.Facebook.ClientId
            : _options.Google.ClientId;

        var codeVerifier = Pkce.CreateCodeVerifier();
        var codeChallenge = Pkce.ComputeCodeChallenge(codeVerifier);
        var state = _stateStore.Create(provider.Provider, codeVerifier, request.ReturnUrl);

        var url = provider.BuildAuthorizeUrl(clientId, _options.RedirectUri, state, codeChallenge, "S256");

        return Task.FromResult(new ExternalAuthorizeUrlDto(url, state, provider.Provider.ToString()));
    }
}
