using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Caching;

namespace TutorHub.Infrastructure.Caching;

/// <summary>
/// WP6: evicts the cached per-user token version over
/// <see cref="IDistributedCache"/> after a bump. Best-effort by contract:
/// any cache error is swallowed (debug log) because a missed eviction only
/// delays revocation until the short entry expires, and a Redis outage fails
/// closed in the revocation middleware itself.
/// </summary>
public sealed class DistributedTokenVersionCache : ITokenVersionCache
{
    private readonly IDistributedCache _cache;
    private readonly ILogger<DistributedTokenVersionCache> _logger;

    public DistributedTokenVersionCache(
        IDistributedCache cache,
        ILogger<DistributedTokenVersionCache> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task EvictAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            await _cache
                .RemoveAsync(TokenVersionDefaults.CacheKeyFor(userId), cancellationToken)
                .ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Best-effort token-version eviction failed for user {UserId}.", userId);
        }
    }
}
