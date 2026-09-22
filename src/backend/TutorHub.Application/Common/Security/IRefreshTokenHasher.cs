namespace TutorHub.Application.Common.Security;

/// <summary>
/// Hashes opaque refresh tokens for storage (P0-D1).
///
/// A refresh token is a bearer credential: whoever holds it can mint new access
/// tokens. Only the hash is persisted, so a database leak alone does not hand over
/// usable sessions.
/// </summary>
public interface IRefreshTokenHasher
{
    /// <summary>
    /// Returns the value persisted in <c>RefreshToken.TokenHash</c> for the given
    /// raw token. Deterministic, so the same raw token can be looked up again.
    /// </summary>
    string Hash(string rawToken);
}
