using TutorHub.Domain.Enums;

namespace TutorHub.Application.Common.Interfaces;

/// <summary>
/// Holds in-flight external sign-in attempts: the anti-CSRF <c>state</c> and the
/// PKCE <c>code_verifier</c> that must match the challenge sent to the provider.
///
/// Lives server-side on purpose. The browser only ever sees <c>state</c>; if it also
/// held the verifier, an attacker who could read the callback URL could complete
/// the exchange. Each entry is single-use and time-limited — replaying a callback
/// is rejected.
/// </summary>
public interface IExternalAuthStateStore
{
    /// <summary>Records a fresh attempt and returns the state value to hand the browser.</summary>
    string Create(
        ExternalAuthProvider provider,
        string codeVerifier,
        string? returnUrl,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Atomically consumes the attempt. Returns null when the state is unknown,
    /// already used, expired, or was issued for a different provider — all four are
    /// indistinguishable to the caller on purpose.
    /// </summary>
    PendingExternalAuth? Consume(string state, ExternalAuthProvider provider, CancellationToken cancellationToken = default);
}

/// <summary>A stored, not-yet-consumed sign-in attempt.</summary>
public sealed record PendingExternalAuth(
    ExternalAuthProvider Provider,
    string CodeVerifier,
    string? ReturnUrl);
