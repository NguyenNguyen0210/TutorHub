using StackExchange.Redis;

namespace TutorHub.Api.RateLimiting;

/// <summary>
/// Minimal seam over the single Redis operation the distributed fixed-window
/// limiter needs. <see cref="IDatabase"/> is a very wide interface, so the
/// service depends on this one-method seam instead (same pattern as
/// IRedisStringCommands for OAuth state and IRedisLockCommands for cron
/// locks) and stays unit-testable without a live Redis.
/// </summary>
public interface IRedisRateLimitCommands
{
    /// <summary>
    /// Atomically increments the counter at <paramref name="key"/>, setting
    /// its expiry to <paramref name="windowSeconds"/> on first increment
    /// (Lua INCR+EXPIRE). Returns the counter value after incrementing.
    /// </summary>
    Task<long> IncrementWithExpiryAsync(string key, int windowSeconds, CancellationToken cancellationToken = default);
}

/// <summary>Production <see cref="IRedisRateLimitCommands"/> backed by StackExchange.Redis.</summary>
public sealed class StackExchangeRedisRateLimitCommands : IRedisRateLimitCommands
{
    // One atomic script: a separate INCR then EXPIRE would leak keys without
    // expiry when a node crashes between the two calls.
    private const string IncrementScript =
        "local c = redis.call('INCR',KEYS[1]); if c == 1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return c";

    private readonly IDatabase _database;

    public StackExchangeRedisRateLimitCommands(IDatabase database)
    {
        _database = database;
    }

    public async Task<long> IncrementWithExpiryAsync(string key, int windowSeconds, CancellationToken cancellationToken = default) =>
        // ScriptEvaluateAsync takes no CancellationToken, so it is dropped here.
        (long)await _database.ScriptEvaluateAsync(
            IncrementScript,
            new RedisKey[] { key },
            new RedisValue[] { windowSeconds }).ConfigureAwait(false);
}
