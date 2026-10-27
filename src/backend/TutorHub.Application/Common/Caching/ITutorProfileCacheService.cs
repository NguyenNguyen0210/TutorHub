using TutorHub.Application.Features.Tutors.DTOs;

namespace TutorHub.Application.Common.Caching;

/// <summary>
/// Read-through cache for public tutor profile views.
/// Implementations fail open: any cache error falls back to the factory (the database).
/// </summary>
public interface ITutorProfileCacheService
{
    Task<TutorProfileDto?> GetTutorProfileAsync(
        Guid tutorProfileId,
        Func<Task<TutorProfileDto?>> factory,
        CancellationToken cancellationToken = default);

    /// <summary>Drops the cached tutor profile entry.</summary>
    Task InvalidateTutorProfileAsync(Guid tutorProfileId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Pass-through used when the cache is disabled: always hits the database,
/// so disabled mode behaves byte-identically to uncached code.
/// </summary>
public sealed class NoOpTutorProfileCacheService : ITutorProfileCacheService
{
    public static readonly NoOpTutorProfileCacheService Instance = new();

    private NoOpTutorProfileCacheService()
    {
    }

    public Task<TutorProfileDto?> GetTutorProfileAsync(
        Guid tutorProfileId,
        Func<Task<TutorProfileDto?>> factory,
        CancellationToken cancellationToken = default) => factory();

    public Task InvalidateTutorProfileAsync(Guid tutorProfileId, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}

