using System.Security.Cryptography;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Options;
using TutorHub.Infrastructure.Authentication;
using Xunit;

namespace TutorHub.Infrastructure.UnitTests.Authentication;

/// <summary>
/// P0-D1 / P0-F3: refresh tokens are stored as HMAC-SHA256(pepper, rawToken) in
/// lowercase hex. The algorithm is pinned here on purpose — a keyed hash is what makes
/// a stolen database useless without the pepper, and plain SHA-256 would silently
/// remove that property.
/// </summary>
public class RefreshTokenHasherTests
{
    private const string Pepper = "unit-test-pepper-that-is-at-least-32-chars-long";

    private static RefreshTokenHasher CreateHasher(string pepper = Pepper) =>
        new(Options.Create(new RefreshTokenOptions { Pepper = pepper }));

    [Fact]
    public void Hash_IsHmacSha256OfPepperAndToken_InLowercaseHex()
    {
        const string rawToken = "raw-refresh-token-value";

        var expected = Convert
            .ToHexString(new HMACSHA256(Encoding.UTF8.GetBytes(Pepper))
                .ComputeHash(Encoding.UTF8.GetBytes(rawToken)))
            .ToLowerInvariant();

        CreateHasher().Hash(rawToken).Should().Be(expected);
    }

    [Fact]
    public void Hash_IsDeterministicAndNeverContainsTheRawToken()
    {
        const string rawToken = "raw-refresh-token-value";
        var hasher = CreateHasher();

        var hash = hasher.Hash(rawToken);

        hash.Should().Be(hasher.Hash(rawToken), "tokens are looked up by hash");
        hash.Should().MatchRegex("^[0-9a-f]{64}$");
        hash.Should().NotContain(rawToken);
    }

    [Fact]
    public void Hash_WithADifferentPepper_ProducesADifferentHash()
    {
        const string rawToken = "raw-refresh-token-value";

        var withFirstPepper = CreateHasher("pepper-one-that-is-at-least-32-characters-long").Hash(rawToken);
        var withSecondPepper = CreateHasher("pepper-two-that-is-at-least-32-characters-long").Hash(rawToken);

        withSecondPepper.Should().NotBe(withFirstPepper,
            "without the pepper a leaked database must not be verifiable offline");
    }

    [Fact]
    public void Hash_WithDifferentTokens_ProducesDifferentHashes()
    {
        var hasher = CreateHasher();

        hasher.Hash("token-a").Should().NotBe(hasher.Hash("token-b"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Hash_WithAMissingToken_Throws(string? rawToken)
    {
        Action act = () => CreateHasher().Hash(rawToken!);

        act.Should().Throw<ArgumentException>();
    }
}
