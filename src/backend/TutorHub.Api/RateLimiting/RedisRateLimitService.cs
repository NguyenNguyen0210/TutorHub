using StackExchange.Redis;
using TutorHub.Api.Configuration;

namespace TutorHub.Api.RateLimiting;

/// <summary>The verdict of one fixed-window check.</summary>
/// <param name="Allowed">False when the policy budget for this window is spent.</param>
/// <param name="RetryAfterSeconds">Seconds left in the current window (0 when fail-open).</param>
public sealed record RateLimitDecision(bool Allowed, int RetryAfterSeconds);

/// <summary>
/// WP3: distributed fixed-window rate limiting over Redis. Each
/// (policy, client IP, minute bucket) has one counter key incremented by an
/// atomic Lua script, so every API node counts together. Permit budgets are
/// single-sourced from <see cref="RateLimitingPolicies"/> (shared with the
/// in-memory limiter), so the two backends can never drift apart. A dead
/// Redis fails open: the request is allowed and a warning is logged, never
/// thrown.
/// </summary>
public sealed class RedisRateLimitService
{
    /// <summary>Policy name used when the endpoint carries no rate-limit attribute (matches GlobalLimiter).</summary>
    public const string GlobalPolicyName = "global";

    /// <summary>Fixed window in seconds (mirrors RateLimitingSetup.Window).</summary>
    public const int WindowSeconds = 60;

    private readonly IRedisRateLimitCommands _commands;
    private readonly TimeProvider _time;
    private readonly ILogger<RedisRateLimitService> _logger;

    public RedisRateLimitService(
        IRedisRateLimitCommands commands,
        TimeProvider time,
        ILogger<RedisRateLimitService> logger)
    {
        _commands = commands;
        _time = time;
        _logger = logger;
    }

    public async Task<RateLimitDecision> CheckAsync(string policy, string clientIp, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(policy))
        {
            policy = GlobalPolicyName;
        }

        var permitLimit = PermitLimitFor(policy);
        var epochSeconds = _time.GetUtcNow().ToUnixTimeSeconds();
        var bucket = epochSeconds / WindowSeconds;
        // Single-tenant Redis is assumed (same as the GĐ1 OAuth/cron keys), so
        // RedisOptions.InstanceName is intentionally not applied to the prefix.
        var key = $"ratelimit:{policy}:{clientIp}:{bucket}";

        try
        {
            var count = await _commands.IncrementWithExpiryAsync(key, WindowSeconds, cancellationToken).ConfigureAwait(false);
            var retryAfterSeconds = (int)(WindowSeconds - (epochSeconds % WindowSeconds));
            return new RateLimitDecision(count <= permitLimit, retryAfterSeconds);
        }
        catch (RedisException ex)
        {
            // Fail-open by design (SPEC §WP3): throttling must never take the
            // API down when Redis does. Cancellation still propagates — only
            // Redis failures are swallowed here.
            _logger.LogWarning(ex, "Redis rate-limit check failed for policy {Policy}; allowing the request.", policy);
            return new RateLimitDecision(true, 0);
        }
    }

    private static int PermitLimitFor(string policy)
    {
        if (string.Equals(policy, RateLimitingPolicies.AuthStrict, StringComparison.Ordinal))
        {
            return RateLimitingPolicies.AuthPermitLimit;
        }

        if (string.Equals(policy, RateLimitingPolicies.Payment, StringComparison.Ordinal))
        {
            return RateLimitingPolicies.PaymentPermitLimit;
        }

        return RateLimitingPolicies.GlobalPermitLimit;
    }
}
