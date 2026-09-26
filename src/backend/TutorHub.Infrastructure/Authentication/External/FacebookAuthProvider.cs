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
/// Facebook Login (OAuth 2.0 authorization code + PKCE, Graph API).
///
/// Reference: https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow
/// </summary>
public sealed class FacebookAuthProvider : IExternalAuthProvider
{
    private const string AuthorizeEndpoint = "https://www.facebook.com/v20.0/dialog/oauth";
    private const string TokenEndpoint = "https://graph.facebook.com/v20.0/oauth/access_token";
    private const string UserInfoEndpoint = "https://graph.facebook.com/v20.0/me";
    private const string DefaultScopes = "email,public_profile";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ExternalAuthOptions _options;

    public FacebookAuthProvider(IHttpClientFactory httpClientFactory, IOptions<ExternalAuthOptions> options)
    {
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
    }

    public ExternalAuthProvider Provider => ExternalAuthProvider.Facebook;

    public bool IsConfigured => _options.Facebook.IsConfigured;

    private string Scopes => string.IsNullOrWhiteSpace(_options.Facebook.Scopes) ? DefaultScopes : _options.Facebook.Scopes;

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
            ["code_challenge_method"] = codeChallengeMethod
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
        var http = _httpClientFactory.CreateClient(nameof(FacebookAuthProvider));

        var tokenQuery = new Dictionary<string, string>
        {
            ["client_id"] = clientId,
            ["client_secret"] = clientSecret,
            ["redirect_uri"] = redirectUri,
            ["code"] = code,
            // Facebook requires the verifier to be sent as a query parameter.
            ["code_verifier"] = codeVerifier
        };

        using var tokenResponse = await http.GetAsync($"{TokenEndpoint}?{QueryString(tokenQuery)}", cancellationToken);
        var tokenBody = await tokenResponse.Content.ReadAsStringAsync(cancellationToken);
        if (!tokenResponse.IsSuccessStatusCode)
        {
            throw new ExternalAuthException(
                "Facebook would not accept this sign-in request. It usually means the link " +
                "expired or was already used — please start the sign-in again.");
        }

        var token = JsonSerializer.Deserialize<FacebookTokenResponse>(tokenBody)
                    ?? throw new ExternalAuthException("Facebook returned an unreadable token response.");

        if (string.IsNullOrWhiteSpace(token.AccessToken))
        {
            throw new ExternalAuthException("Facebook did not return an access token.");
        }

        var fields = "id,name,email";
        using var request = new HttpRequestMessage(HttpMethod.Get, $"{UserInfoEndpoint}?fields={fields}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token.AccessToken);

        using var profileResponse = await http.SendAsync(request, cancellationToken);
        var profileBody = await profileResponse.Content.ReadAsStringAsync(cancellationToken);
        if (!profileResponse.IsSuccessStatusCode)
        {
            throw new ExternalAuthException("Facebook accepted the sign-in but would not return your profile.");
        }

        var profile = JsonSerializer.Deserialize<FacebookUserInfo>(profileBody)
                      ?? throw new ExternalAuthException("Facebook returned an unreadable profile.");

        if (string.IsNullOrWhiteSpace(profile.Id))
        {
            throw new ExternalAuthException("Facebook did not return a user id.");
        }

        // Facebook only returns the email if the app has the email permission AND
        // the user granted it. Without it we cannot identify a local account, so
        // the sign-in fails with a message rather than silently creating a duplicate.
        if (string.IsNullOrWhiteSpace(profile.Email))
        {
            throw new ExternalAuthException(
                "Facebook did not share an email address. Grant the email permission in your Facebook app settings, then try again.");
        }

        return new ExternalIdentity(
            Provider,
            profile.Id,
            profile.Email,
            // A verified Graph response is proof the address is controlled; we never
            // accept an email Facebook itself has not confirmed.
            true,
            profile.Name,
            profile.Picture?.Data?.Url);
    }

    private static string QueryString(Dictionary<string, string> values) =>
        string.Join("&", values.Select(kv =>
            $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value)}"));

    private sealed class FacebookTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; set; }
    }

    private sealed class FacebookUserInfo
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("picture")]
        public FacebookPicture? Picture { get; set; }
    }

    private sealed class FacebookPicture
    {
        [JsonPropertyName("data")]
        public FacebookPictureData? Data { get; set; }
    }

    private sealed class FacebookPictureData
    {
        [JsonPropertyName("url")]
        public string? Url { get; set; }
    }
}
