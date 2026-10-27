using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Caching;
using TutorHub.Application.Features.Services.DTOs;

namespace TutorHub.Infrastructure.Caching;

/// <summary>
/// Read-through cache for public service detail views over <see cref="IDistributedCache"/>.
/// Fail-open: any Redis glitch falls back to database queries.
/// </summary>
public class ServiceDetailCacheService : IServiceDetailCacheService
{
    private static readonly TimeSpan DetailTtl = TimeSpan.FromMinutes(10);

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IDistributedCache _cache;
    private readonly ILogger<ServiceDetailCacheService> _logger;
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

    public ServiceDetailCacheService(IDistributedCache cache, ILogger<ServiceDetailCacheService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public Task<ServiceDetailDto?> GetServiceDetailAsync(
        Guid serviceId,
        Func<Task<ServiceDetailDto?>> factory,
        CancellationToken cancellationToken = default) =>
        GetOrCreateAsync($"service:detail:{serviceId:D}", factory, DetailTtl, cancellationToken);

    public Task InvalidateServiceDetailAsync(Guid serviceId, CancellationToken cancellationToken = default) =>
        TryRemoveAsync($"service:detail:{serviceId:D}", cancellationToken);

    private async Task<T?> GetOrCreateAsync<T>(
        string key,
        Func<Task<T?>> factory,
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

    private async Task<T?> TryGetAsync<T>(string key, CancellationToken cancellationToken) where T : class?
    {
        try
        {
            var raw = await _cache.GetStringAsync(key, cancellationToken);
            return raw is null ? null : JsonSerializer.Deserialize<T>(raw, JsonOptions);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogDebug(ex, "Service detail cache read failed for {CacheKey}; falling back to database.", key);
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
            _logger.LogWarning(ex, "Service detail cache write failed for {CacheKey}.", key);
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
            _logger.LogWarning(ex, "Service detail cache remove failed for {CacheKey}.", key);
        }
    }
}

