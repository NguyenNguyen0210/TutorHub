using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Caching;
using TutorHub.Application.Features.Categories.DTOs;

namespace TutorHub.Infrastructure.Caching;

/// <summary>
/// Read-through cache for public categories over <see cref="IDistributedCache"/>.
/// The category tree key embeds a version counter (<c>cat:ver</c>, bumped on CUD)
/// so invalidation never needs a key scan. Every cache failure falls back to the
/// database (fail-open); a lost invalidation is bounded by the entry TTL.
/// </summary>
public class CategoryCacheService : ICategoryCacheService
{
    private static readonly TimeSpan TreeTtl = TimeSpan.FromHours(24);
    private static readonly TimeSpan DetailTtl = TimeSpan.FromHours(24);
    private static readonly TimeSpan VersionTtl = TimeSpan.FromDays(7);
    private const string VersionKey = "cat:ver";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IDistributedCache _cache;
    private readonly ILogger<CategoryCacheService> _logger;
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

    public CategoryCacheService(IDistributedCache cache, ILogger<CategoryCacheService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<IReadOnlyList<PublicCategoryDto>> GetPublicCategoriesAsync(
        Func<Task<IReadOnlyList<PublicCategoryDto>>> factory,
        CancellationToken cancellationToken = default)
    {
        var version = await GetVersionAsync(cancellationToken);
        var key = $"cat:tree:v{version}";
        return await GetOrCreateAsync(key, factory, TreeTtl, cancellationToken)
            ?? Array.Empty<PublicCategoryDto>();
    }

    public Task<PublicCategoryDto?> GetCategoryAsync(
        Guid id,
        Func<Task<PublicCategoryDto?>> factory,
        CancellationToken cancellationToken = default) =>
        GetOrCreateAsync($"cat:{id:D}", factory, DetailTtl, cancellationToken);

    public Task InvalidateCategoriesAsync(CancellationToken cancellationToken = default) =>
        BumpVersionAsync(cancellationToken);

    public async Task InvalidateCategoryAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await BumpVersionAsync(cancellationToken);
        await TryRemoveAsync($"cat:{id:D}", cancellationToken);
    }

    private async Task<T> GetOrCreateAsync<T>(
        string key,
        Func<Task<T>> factory,
        TimeSpan ttl,
        CancellationToken cancellationToken) where T : class?
    {
        var cached = await TryGetAsync<T>(key, cancellationToken);
        if (cached is not null)
        {
            return cached;
        }

        var gate = _locks.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync(cancellationToken);
        try
        {
            cached = await TryGetAsync<T>(key, cancellationToken);
            if (cached is not null)
            {
                return cached;
            }

            var fresh = await factory();
            if (fresh is not null)
            {
                await TrySetAsync(key, fresh, ttl, cancellationToken);
            }

            return fresh;
        }
        finally
        {
            gate.Release();
            _locks.TryRemove(key, out _);
        }
    }

    private async Task<long> GetVersionAsync(CancellationToken cancellationToken)
    {
        try
        {
            var raw = await _cache.GetStringAsync(VersionKey, cancellationToken);
            return long.TryParse(raw, out var version) ? version : 0;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogDebug(ex, "Category tree version read failed; treating as version 0.");
            return 0;
        }
    }

    private async Task BumpVersionAsync(CancellationToken cancellationToken)
    {
        try
        {
            var version = await GetVersionAsync(cancellationToken);
            await _cache.SetStringAsync(
                VersionKey,
                (version + 1).ToString(),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = VersionTtl },
                cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Category tree version bump failed; stale entries expire via TTL.");
        }
    }

    private async Task<T?> TryGetAsync<T>(string key, CancellationToken cancellationToken) where T : class?
    {
        try
        {
            var raw = await _cache.GetStringAsync(key, cancellationToken);
            return raw is null ? null : JsonSerializer.Deserialize<T>(raw, JsonOptions);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogDebug(ex, "Category cache read failed for {CacheKey}; falling back to database.", key);
            return null;
        }
    }

    private async Task TrySetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken cancellationToken) where T : class?
    {
        try
        {
            await _cache.SetStringAsync(
                key,
                JsonSerializer.Serialize(value, JsonOptions),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = ttl },
                cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Category cache write failed for {CacheKey}.", key);
        }
    }

    private async Task TryRemoveAsync(string key, CancellationToken cancellationToken)
    {
        try
        {
            await _cache.RemoveAsync(key, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Category cache remove failed for {CacheKey}.", key);
        }
    }
}

