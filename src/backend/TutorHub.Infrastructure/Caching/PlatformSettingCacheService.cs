using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Caching;

namespace TutorHub.Infrastructure.Caching;

/// <summary>
/// WP5 read-through cache for platform settings over <see cref="IDistributedCache"/>.
/// Fail-open: any cache error falls back to the database, and failures are
/// never cached.
/// </summary>
public class PlatformSettingCacheService : IPlatformSettingCacheService
{
    private static readonly TimeSpan SettingTtl = TimeSpan.FromMinutes(2);

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IDistributedCache _cache;
    private readonly ILogger<PlatformSettingCacheService> _logger;
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

    public PlatformSettingCacheService(IDistributedCache cache, ILogger<PlatformSettingCacheService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<PlatformSettingSnapshot?> GetSettingAsync(
        string key,
        Func<CancellationToken, Task<PlatformSettingSnapshot?>> factory,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = CacheKey(key);
        var cached = await TryGetAsync(cacheKey, cancellationToken);
        if (cached is not null)
        {
            return cached;
        }

        var gate = _locks.GetOrAdd(cacheKey, _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync(cancellationToken);
        try
        {
            cached = await TryGetAsync(cacheKey, cancellationToken);
            if (cached is not null)
            {
                return cached;
            }

            var fresh = await factory(cancellationToken);
            if (fresh is not null)
            {
                await TrySetAsync(cacheKey, fresh, cancellationToken);
            }

            return fresh;
        }
        finally
        {
            gate.Release();
            // Not disposed: a waiter holding the reference past removal still
            // needs it; an uncontended SemaphoreSlim holds no native handle.
            _locks.TryRemove(cacheKey, out _);
        }
    }

    public async Task RemoveSettingAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            await _cache.RemoveAsync(CacheKey(key), cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Platform setting cache remove failed for {SettingKey}.", key);
        }
    }

    private static string CacheKey(string key) => $"platform:setting:{key}";

    private async Task<PlatformSettingSnapshot?> TryGetAsync(string cacheKey, CancellationToken cancellationToken)
    {
        try
        {
            var raw = await _cache.GetStringAsync(cacheKey, cancellationToken);
            return raw is null ? null : JsonSerializer.Deserialize<PlatformSettingSnapshot>(raw, JsonOptions);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogDebug(ex, "Platform setting cache read failed for {CacheKey}; falling back to database.", cacheKey);
            return null;
        }
    }

    private async Task TrySetAsync(string cacheKey, PlatformSettingSnapshot value, CancellationToken cancellationToken)
    {
        try
        {
            await _cache.SetStringAsync(
                cacheKey,
                JsonSerializer.Serialize(value, JsonOptions),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = SettingTtl },
                cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Platform setting cache write failed for {CacheKey}.", cacheKey);
        }
    }
}
