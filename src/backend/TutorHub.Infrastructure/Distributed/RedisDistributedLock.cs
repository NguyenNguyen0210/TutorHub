using StackExchange.Redis;

namespace TutorHub.Infrastructure.Distributed;

/// <summary>
/// Minimal seam over the two Redis commands the cron lock needs.
/// <see cref="IDatabase"/> is a very wide interface, so the lock depends on
/// this two-method seam instead (same pattern as IRedisStringCommands for
/// OAuth state) and stays unit-testable without a live Redis.
/// </summary>
public interface IRedisLockCommands
{
    /// <summary>SET key value PX expiry NX. Returns false when another holder owns the key.</summary>
    Task<bool> SetIfNotExistsAsync(string key, string value, TimeSpan expiry, CancellationToken cancellationToken = default);

    /// <summary>Deletes key only when its value still equals <paramref name="expectedValue"/>.</summary>
    Task CompareDeleteAsync(string key, string expectedValue, CancellationToken cancellationToken = default);
}

/// <summary>WP4 Redis cron lock over <see cref="IRedisLockCommands"/>.</summary>
public sealed class RedisDistributedLock : IRedisDistributedLock
{
    private readonly IRedisLockCommands _commands;

    public RedisDistributedLock(IRedisLockCommands commands)
    {
        _commands = commands;
    }

    public Task<bool> AcquireAsync(string key, string token, TimeSpan ttl, CancellationToken cancellationToken = default) =>
        _commands.SetIfNotExistsAsync(key, token, ttl, cancellationToken);

    public Task ReleaseAsync(string key, string token, CancellationToken cancellationToken = default) =>
        _commands.CompareDeleteAsync(key, token, cancellationToken);
}

/// <summary>Production <see cref="IRedisLockCommands"/> backed by StackExchange.Redis.</summary>
public sealed class StackExchangeRedisLockCommands : IRedisLockCommands
{
    // Compare-del must stay one atomic script: a separate GET then DEL would
    // let a node delete the next holder's lock after its own entry expired.
    private const string ReleaseScript = "if redis.call(\"get\",KEYS[1])==ARGV[1] then return redis.call(\"del\",KEYS[1]) else return 0 end";

    private readonly IDatabase _database;

    public StackExchangeRedisLockCommands(IDatabase database)
    {
        _database = database;
    }

    public async Task<bool> SetIfNotExistsAsync(string key, string value, TimeSpan expiry, CancellationToken cancellationToken = default) =>
        await _database.StringSetAsync(key, value, expiry, When.NotExists).ConfigureAwait(false);

    public async Task CompareDeleteAsync(string key, string expectedValue, CancellationToken cancellationToken = default) =>
        // ScriptEvaluateAsync takes no CancellationToken, so it is dropped here.
        await _database.ScriptEvaluateAsync(
            ReleaseScript,
            new RedisKey[] { key },
            new RedisValue[] { expectedValue }).ConfigureAwait(false);
}
