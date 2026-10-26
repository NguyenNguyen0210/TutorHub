using TutorHub.Application.Features.Services.DTOs;

namespace TutorHub.Application.Common.Caching;

/// <summary>
/// Read-through cache for public service detail reads.
/// Implementations fail open: any cache error falls back to the factory (the database).
/// </summary>
public interface IServiceDetailCacheService
{
    Task<ServiceDetailDto?> GetServiceDetailAsync(
        Guid serviceId,
        Func<Task<ServiceDetailDto?>> factory,
        CancellationToken cancellationToken = default);

    /// <summary>Drops the cached service detail entry.</summary>
    Task InvalidateServiceDetailAsync(Guid serviceId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Pass-through used when the cache is disabled: always hits the database,
/// so disabled mode behaves byte-identically to uncached code.
/// </summary>
public sealed class NoOpServiceDetailCacheService : IServiceDetailCacheService
{
    public static readonly NoOpServiceDetailCacheService Instance = new();

    private NoOpServiceDetailCacheService()
    {
    }

    public Task<ServiceDetailDto?> GetServiceDetailAsync(
        Guid serviceId,
        Func<Task<ServiceDetailDto?>> factory,
        CancellationToken cancellationToken = default) => factory();

    public Task InvalidateServiceDetailAsync(Guid serviceId, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}

