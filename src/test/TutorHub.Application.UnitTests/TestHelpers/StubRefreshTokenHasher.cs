using TutorHub.Application.Common.Security;

namespace TutorHub.Application.UnitTests.TestHelpers;

/// <summary>
/// Deterministic stand-in for the real HMAC hasher (P0-D1) so tests can seed a
/// refresh-token row whose <c>TokenHash</c> matches the raw token they present,
/// without depending on the production pepper.
/// </summary>
public sealed class StubRefreshTokenHasher : IRefreshTokenHasher
{
    public string Hash(string rawToken) => "hash:" + rawToken;
}
