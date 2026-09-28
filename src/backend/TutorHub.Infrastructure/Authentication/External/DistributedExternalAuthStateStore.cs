using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Domain.Enums;

namespace TutorHub.Infrastructure.Authentication.External;

/// <summary>
/// Redis-backed <see cref="IExternalAuthStateStore"/>. Same observable semantics
/// as <see cref="MemoryExternalAuthStateStore"/> (single-use, provider-bound,
/// fail-closed) but shared across nodes. Consume is atomic via GETDEL, so two
/// nodes racing the same callback cannot both succeed.
/// </summary>
public sealed class DistributedExternalAuthStateStore : IExternalAuthStateStore
{
    private static readonly string StateKeyPrefix = "external-auth:state:";
    private const int MaxStateAttempts = 3;

    private readonly IRedisStringCommands _redis;
    private readonly ExternalAuthOptions _options;

    public DistributedExternalAuthStateStore(
        IRedisStringCommands redis,
        IOptions<ExternalAuthOptions> options)
    {
        _redis = redis;
        _options = options.Value;
    }

    public string Create(ExternalAuthProvider provider, string codeVerifier, string? returnUrl, CancellationToken cancellationToken = default)
    {
        var entry = new PendingExternalAuth(provider, codeVerifier, returnUrl);
        var payload = JsonSerializer.Serialize(entry);
        var expiry = TimeSpan.FromMinutes(Math.Max(1, _options.StateLifetimeMinutes));

        // 256 bits of entropy per attempt; on the astronomically unlikely NX
        // collision, mint a fresh state rather than overwriting someone else's.
        for (var attempt = 0; attempt < MaxStateAttempts; attempt++)
        {
            var state = Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
            if (_redis.StringSet(StateKeyPrefix + state, payload, expiry, whenNotExists: true, cancellationToken))
            {
                return state;
            }
        }

        throw new InvalidOperationException(
            "Failed to mint a unique OAuth state after 3 attempts. Redis may be unhealthy — see RedisHealthCheck.");
    }

    public PendingExternalAuth? Consume(string state, ExternalAuthProvider provider, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(state))
        {
            return null;
        }

        // GETDEL removes BEFORE we inspect: a second attempt finds nothing,
        // which is what makes this single-use across nodes.
        var payload = _redis.StringGetDelete(StateKeyPrefix + state, cancellationToken);
        if (payload is null)
        {
            return null;
        }

        PendingExternalAuth? entry;
        try
        {
            entry = JsonSerializer.Deserialize<PendingExternalAuth>(payload);
        }
        catch (JsonException)
        {
            return null;
        }

        if (entry is null)
        {
            return null;
        }

        // A state minted for Google must not complete a Facebook sign-in.
        // Already deleted above, matching the memory store's remove-first order.
        if (entry.Provider != provider)
        {
            return null;
        }

        return entry;
    }

    /// <summary>
    /// RFC 7636 S256: BASE64URL(SHA256(verifier)). Identical to
    /// <see cref="MemoryExternalAuthStateStore.CreateCodeVerifier"/> — callers
    /// may use either class.
    /// </summary>
    public static string CreateCodeVerifier()
    {
        // 32 random bytes -> 43 base64url characters, the RFC 7636 minimum.
        return Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
    }

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
