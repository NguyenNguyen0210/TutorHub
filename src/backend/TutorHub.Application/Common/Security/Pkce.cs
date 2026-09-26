using System.Security.Cryptography;
using System.Text;

namespace TutorHub.Application.Common.Security;

/// <summary>
/// RFC 7636 Proof Key for Code Exchange.
///
/// A 43-character verifier is derived from 32 random bytes; the challenge is its
/// S256 digest. The provider recomputes the digest from the verifier we send at
/// exchange time, so an intercepted authorization code is useless on its own.
///
/// Lives here rather than beside the state store because the Application layer
/// builds the authorize URL and must not depend on Infrastructure.
/// </summary>
public static class Pkce
{
    public static string CreateCodeVerifier() =>
        Base64UrlEncode(RandomNumberGenerator.GetBytes(32));

    public static string ComputeCodeChallenge(string codeVerifier)
    {
        var hash = SHA256.HashData(Encoding.ASCII.GetBytes(codeVerifier));
        return Base64UrlEncode(hash);
    }

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
}
