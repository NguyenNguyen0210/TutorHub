namespace TutorHub.Infrastructure.Distributed;

/// <summary>
/// WP4 distributed cron lock: at most one node holds a key at a time.
/// Acquire is SET key token NX PX ttl; Release deletes only when the stored
/// token still matches (Lua compare-del), so a node never drops a lock that
/// another node has since re-acquired.
/// </summary>
public interface IRedisDistributedLock
{
    /// <summary>
    /// Tries to hold <paramref name="key"/> for <paramref name="ttl"/>.
    /// Returns false when another node holds it (skip the tick); a Redis
    /// failure throws and the job's existing error path handles it.
    /// </summary>
    Task<bool> AcquireAsync(string key, string token, TimeSpan ttl, CancellationToken cancellationToken = default);

    /// <summary>Releases <paramref name="key"/> when it still holds <paramref name="token"/>; no-op otherwise.</summary>
    Task ReleaseAsync(string key, string token, CancellationToken cancellationToken = default);
}

/// <summary>
/// Pass-through used when the cron lock is disabled: every acquire succeeds,
/// so disabled mode behaves exactly like the original unlocked jobs.
/// </summary>
public sealed class NoOpRedisDistributedLock : IRedisDistributedLock
{
    public static readonly NoOpRedisDistributedLock Instance = new();

    private NoOpRedisDistributedLock()
    {
    }

    public Task<bool> AcquireAsync(string key, string token, TimeSpan ttl, CancellationToken cancellationToken = default) =>
        Task.FromResult(true);

    public Task ReleaseAsync(string key, string token, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
