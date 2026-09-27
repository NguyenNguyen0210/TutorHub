using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Domain.Enums;

namespace TutorHub.Infrastructure.Authentication.External;

/// <summary>
/// In-memory store for pending sign-in attempts.
///
/// Single-node by design. Two API instances behind a load balancer would not share
/// these entries, so a callback landing on the other node would be rejected. That is
/// a fail-closed failure (the user retries) rather than an authentication bypass —
/// but it does mean moving to Redis before scaling out. The alternative, a table
/// per attempt, buys nothing until then and costs a write on every button click.
/// </summary>
public sealed class MemoryExternalAuthStateStore : IExternalAuthStateStore
{
    private static readonly string StateKeyPrefix = "external-auth:state:";
    private readonly object _stateLock = new();

    private readonly IMemoryCache _cache;
    private readonly ExternalAuthOptions _options;
    private readonly TimeProvider _timeProvider;

    public MemoryExternalAuthStateStore(
        IMemoryCache cache,
        IOptions<ExternalAuthOptions> options,
        TimeProvider timeProvider)
    {
        _cache = cache;
        _options = options.Value;
        _timeProvider = timeProvider;
    }

    public string Create(ExternalAuthProvider provider, string codeVerifier, string? returnUrl, CancellationToken cancellationToken = default)
    {
        // 256 bits of entropy: `state` is the CSRF binding, so guessing it must be
        // infeasible, not merely unlikely.
        var state = Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        var entry = new PendingExternalAuth(provider, codeVerifier, returnUrl);

        _cache.Set(
            StateKeyPrefix + state,
            entry,
            new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(Math.Max(1, _options.StateLifetimeMinutes)),
                Size = 1
            });

        return state;
    }

    public PendingExternalAuth? Consume(string state, ExternalAuthProvider provider, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(state))
        {
            return null;
        }

        PendingExternalAuth? entry;
        lock (_stateLock)
        {
            // Remove BEFORE inspecting: a second attempt with the same state finds
            // nothing, which is what makes this single-use.
            if (!_cache.TryGetValue(StateKeyPrefix + state, out entry) || entry is null)
            {
                return null;
            }

            _cache.Remove(StateKeyPrefix + state);
        }

        // A state minted for Google must not complete a Facebook sign-in.
        if (entry.Provider != provider)
        {
            return null;
        }

        return entry;
    }

    /// <summary>
    /// RFC 7636 S256: BASE64URL(SHA256(verifier)). The provider recomputes this from
    /// the verifier we send at exchange time; they must match, which is what proves
    /// the caller is the same party that started the flow.
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
