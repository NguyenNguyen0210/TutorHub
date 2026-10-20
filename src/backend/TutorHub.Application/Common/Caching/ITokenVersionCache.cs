namespace TutorHub.Application.Common.Caching;

/// <summary>
/// Evicts the cached per-user token version after a bump (Ban/Suspend/
/// ChangePassword) so the next request re-reads the fresh version from the
/// database. Implementations are best-effort and must never throw: a missed
/// eviction only delays revocation until the short cache entry expires, while
/// a Redis outage fails closed in the revocation middleware itself.
/// </summary>
public interface ITokenVersionCache
{
    Task EvictAsync(Guid userId, CancellationToken cancellationToken = default);
}

/// <summary>
/// No-op used when the RevokeCheck flag is off: eviction is unnecessary
/// because the middleware is not in the pipeline and nothing reads the cache.
/// </summary>
public sealed class NoOpTokenVersionCache : ITokenVersionCache
{
    public static readonly NoOpTokenVersionCache Instance = new();

    private NoOpTokenVersionCache()
    {
    }

    public Task EvictAsync(Guid userId, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
