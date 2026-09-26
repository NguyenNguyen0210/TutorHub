using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Domain.Enums;

namespace TutorHub.Infrastructure.Authentication.External;

/// <summary>
/// Google Sign-In (OpenID Connect, authorization code + PKCE).
///
/// Reference: https://developers.google.com/identity/protocols/oauth2/openid-connect
/// </summary>
public sealed class GoogleAuthProvider : IExternalAuthProvider
{
    private const string AuthorizeEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
    private const string TokenEndpoint = "https://oauth2.googleapis.com/token";
    private const string UserInfoEndpoint = "https://openidconnect.googleapis.com/v1/userinfo";
    private const string DefaultScopes = "openid email profile";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ExternalAuthOptions _options;

    public GoogleAuthProvider(IHttpClientFactory httpClientFactory, IOptions<ExternalAuthOptions> options)
    {
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
    }

    public ExternalAuthProvider Provider => ExternalAuthProvider.Google;

    public bool IsConfigured => _options.Google.IsConfigured;

    private string Scopes => string.IsNullOrWhiteSpace(_options.Google.Scopes) ? DefaultScopes : _options.Google.Scopes;

    public string BuildAuthorizeUrl(string clientId, string redirectUri, string state, string codeChallenge, string codeChallengeMethod)
    {
        var query = new Dictionary<string, string>
        {
            ["client_id"] = clientId,
            ["redirect_uri"] = redirectUri,
            ["response_type"] = "code",
            ["scope"] = Scopes,
            ["state"] = state,
            ["code_challenge"] = codeChallenge,
            ["code_challenge_method"] = codeChallengeMethod,
            // Without this Google may reuse a previous session silently, which is
            // surprising when switching accounts. "select_account" always asks.
            ["prompt"] = "select_account"
        };

        return $"{AuthorizeEndpoint}?{QueryString(query)}";
    }

    public async Task<ExternalIdentity> ExchangeCodeAsync(
        string clientId,
        string clientSecret,
        string redirectUri,
        string code,
        string codeVerifier,
        CancellationToken cancellationToken)
    {
        var http = _httpClientFactory.CreateClient(nameof(GoogleAuthProvider));

        using var tokenResponse = await http.PostAsync(TokenEndpoint, new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["code"] = code,
            ["client_id"] = clientId,
            ["client_secret"] = clientSecret,
            ["redirect_uri"] = redirectUri,
            ["grant_type"] = "authorization_code",
            ["code_verifier"] = codeVerifier
        }), cancellationToken);

        var tokenBody = await tokenResponse.Content.ReadAsStringAsync(cancellationToken);
        if (!tokenResponse.IsSuccessStatusCode)
        {
            // A rejected code is almost always expired or already spent, which is what
            // the user sees if they reload the callback page. Say so instead of
            // quoting Google's status code at them.
            throw new ExternalAuthException(
                "Google would not accept this sign-in request. It usually means the link " +
                "expired or was already used — please start the sign-in again.");
        }

        var token = JsonSerializer.Deserialize<GoogleTokenResponse>(tokenBody)
                    ?? throw new ExternalAuthException("Google returned an unreadable token response.");

        if (string.IsNullOrWhiteSpace(token.AccessToken))
        {
            throw new ExternalAuthException("Google did not return an access token.");
        }

        using var request = new HttpRequestMessage(HttpMethod.Get, UserInfoEndpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token.AccessToken);

        using var profileResponse = await http.SendAsync(request, cancellationToken);
        var profileBody = await profileResponse.Content.ReadAsStringAsync(cancellationToken);
        if (!profileResponse.IsSuccessStatusCode)
        {
            throw new ExternalAuthException("Google accepted the sign-in but would not return your profile.");
        }

        var profile = JsonSerializer.Deserialize<GoogleUserInfo>(profileBody)
                      ?? throw new ExternalAuthException("Google returned an unreadable profile.");

        if (string.IsNullOrWhiteSpace(profile.Sub) || string.IsNullOrWhiteSpace(profile.Email))
        {
            throw new ExternalAuthException("Google did not return both a subject id and an email.");
        }

        return new ExternalIdentity(
            Provider,
            profile.Sub,
            profile.Email,
            // Google states verification explicitly; absence of the claim is NOT consent.
            profile.EmailVerified ?? false,
            profile.Name,
            profile.Picture);
    }

    private static string QueryString(Dictionary<string, string> values) =>
        string.Join("&", values.Select(kv =>
            $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value)}"));

    private sealed class GoogleTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; set; }
    }

    private sealed class GoogleUserInfo
    {
        [JsonPropertyName("sub")]
        public string? Sub { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("email_verified")]
        public bool? EmailVerified { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("picture")]
        public string? Picture { get; set; }
    }
}


