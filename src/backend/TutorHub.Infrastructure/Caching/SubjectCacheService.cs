using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Caching;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Subjects.DTOs;
using TutorHub.Application.Features.Subjects.GetPublicSubjects;

namespace TutorHub.Infrastructure.Caching;

/// <summary>
/// WP5 read-through cache for public subject reads over <see cref="IDistributedCache"/>.
/// List keys embed a version counter (<c>subj:ver</c>, bumped on CUD) so
/// invalidation never needs a key scan. Every cache failure falls back to the
/// database (fail-open); a lost invalidation is bounded by the entry TTL.
/// </summary>
public class SubjectCacheService : ISubjectCacheService
{
    private static readonly TimeSpan ListTtl = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan DetailTtl = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan VersionTtl = TimeSpan.FromDays(1);
    private const string VersionKey = "subj:ver";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IDistributedCache _cache;
    private readonly ILogger<SubjectCacheService> _logger;
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

    public SubjectCacheService(IDistributedCache cache, ILogger<SubjectCacheService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<PagedResult<PublicSubjectDto>> GetPublicSubjectsAsync(
        GetPublicSubjectsQuery query,
        Func<Task<PagedResult<PublicSubjectDto>>> factory,
        CancellationToken cancellationToken = default)
    {
        var version = await GetVersionAsync(cancellationToken);
        var key = $"subj:list:v{version}:{FilterHash(query)}";
        return await GetOrCreateAsync(key, factory, ListTtl, cancellationToken);
    }

    public Task<PublicSubjectDto?> GetSubjectAsync(
        Guid id,
        Func<Task<PublicSubjectDto?>> factory,
        CancellationToken cancellationToken = default) =>
        GetOrCreateAsync($"subj:{id:D}", factory, DetailTtl, cancellationToken);

    public async Task InvalidateSubjectAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await BumpVersionAsync(cancellationToken);
        await TryRemoveAsync($"subj:{id:D}", cancellationToken);
    }

    public async Task InvalidateSubjectsAsync(IEnumerable<Guid> ids, CancellationToken cancellationToken = default)
    {
        await BumpVersionAsync(cancellationToken);
        foreach (var id in ids)
        {
            await TryRemoveAsync($"subj:{id:D}", cancellationToken);
        }
    }

    public Task InvalidateSubjectListsAsync(CancellationToken cancellationToken = default) =>
        BumpVersionAsync(cancellationToken);

    private static string FilterHash(GetPublicSubjectsQuery query)
    {
        var filter = string.Join(
            "|",
            query.CategoryId?.ToString("D") ?? "-",
            query.Search?.Trim().ToLowerInvariant() ?? "-",
            query.PageNumber,
            query.PageSize);
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(filter)));
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
            // Not disposed: a waiter holding the reference past removal still
            // needs it; an uncontended SemaphoreSlim holds no native handle.
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
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Subject list version read failed; treating as version 0.");
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
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Subject list version bump failed; stale lists expire via TTL.");
        }
    }

    private async Task<T?> TryGetAsync<T>(string key, CancellationToken cancellationToken) where T : class?
    {
        try
        {
            var raw = await _cache.GetStringAsync(key, cancellationToken);
            return raw is null ? null : JsonSerializer.Deserialize<T>(raw, JsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Subject cache read failed for {CacheKey}; falling back to database.", key);
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
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Subject cache write failed for {CacheKey}.", key);
        }
    }

    private async Task TryRemoveAsync(string key, CancellationToken cancellationToken)
    {
        try
        {
            await _cache.RemoveAsync(key, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Subject cache remove failed for {CacheKey}.", key);
        }
    }
}
