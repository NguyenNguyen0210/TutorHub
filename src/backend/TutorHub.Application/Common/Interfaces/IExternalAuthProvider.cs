using TutorHub.Domain.Enums;

namespace TutorHub.Application.Common.Interfaces;

/// <summary>
/// Identity as asserted by a provider after the API has verified a token with it.
/// Only the API constructs this, always from a server-to-server response.
/// </summary>
public sealed record ExternalIdentity(
    ExternalAuthProvider Provider,
    string ProviderUserId,
    string Email,
    bool EmailVerified,
    string? FullName,
    string? AvatarUrl);

/// <summary>
/// One external identity provider. Implementations live in the Infrastructure layer
/// because they perform HTTP calls; the Application layer only sees this interface.
/// </summary>
public interface IExternalAuthProvider
{
    ExternalAuthProvider Provider { get; }

    /// <summary>False when credentials are absent, so callers can hide the button.</summary>
    bool IsConfigured { get; }

    /// <summary>
    /// Builds the provider's authorization URL. <paramref name="redirectUri"/> and
    /// <paramref name="state"/> are supplied by the caller (the state store), not
    /// read from configuration, so the two stay in lockstep.
    /// </summary>
    string BuildAuthorizeUrl(string clientId, string redirectUri, string state, string codeChallenge, string codeChallengeMethod);

    /// <summary>
    /// Exchanges an authorization code for the caller's identity. The caller has
    /// already checked <paramref name="state"/> and stored the PKCE verifier.
    /// </summary>
    Task<ExternalIdentity> ExchangeCodeAsync(
        string clientId,
        string clientSecret,
        string redirectUri,
        string code,
        string codeVerifier,
        CancellationToken cancellationToken);
}
