using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Security;

namespace TutorHub.Infrastructure.Authentication;

/// <summary>
/// P0-D1: stores refresh tokens as HMAC-SHA256(pepper, rawToken) in lowercase hex.
///
/// A fast keyed hash is the correct tool here. Unlike a password, the raw token is
/// 64 bytes of CSPRNG output (see <c>JwtService.GenerateRefreshToken</c>), so there
/// is no guessable space to slow an attacker down with bcrypt — and the pepper means
/// a stolen database is not enough to verify candidate tokens offline.
/// </summary>
public sealed class RefreshTokenHasher : IRefreshTokenHasher
{
    private readonly byte[] _pepper;

    public RefreshTokenHasher(IOptions<RefreshTokenOptions> options)
    {
        _pepper = Encoding.UTF8.GetBytes(options.Value.Pepper);
    }

    public string Hash(string rawToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(rawToken);

        using var hmac = new HMACSHA256(_pepper);
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(rawToken));

        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
