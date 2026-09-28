using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Subjects.DTOs;
using TutorHub.Application.Features.Subjects.GetPublicSubjects;

namespace TutorHub.Application.Common.Caching;

/// <summary>
/// Read-through cache for public subject reads. Implementations fail open:
/// any cache error falls back to the factory (the database).
/// </summary>
public interface ISubjectCacheService
{
    Task<PagedResult<PublicSubjectDto>> GetPublicSubjectsAsync(
        GetPublicSubjectsQuery query,
        Func<Task<PagedResult<PublicSubjectDto>>> factory,
        CancellationToken cancellationToken = default);

    Task<PublicSubjectDto?> GetSubjectAsync(
        Guid id,
        Func<Task<PublicSubjectDto?>> factory,
        CancellationToken cancellationToken = default);

    /// <summary>Bumps the list version and drops the detail entry for one subject.</summary>
    Task InvalidateSubjectAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Bumps the list version (category changes affect the public list invariant).</summary>
    Task InvalidateSubjectListsAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Pass-through used when the cache is disabled: always hits the database,
/// so disabled mode behaves byte-identically to uncached code.
/// </summary>
public sealed class NoOpSubjectCacheService : ISubjectCacheService
{
    public static readonly NoOpSubjectCacheService Instance = new();

    private NoOpSubjectCacheService()
    {
    }

    public Task<PagedResult<PublicSubjectDto>> GetPublicSubjectsAsync(
        GetPublicSubjectsQuery query,
        Func<Task<PagedResult<PublicSubjectDto>>> factory,
        CancellationToken cancellationToken = default) => factory();

    public Task<PublicSubjectDto?> GetSubjectAsync(
        Guid id,
        Func<Task<PublicSubjectDto?>> factory,
        CancellationToken cancellationToken = default) => factory();

    public Task InvalidateSubjectAsync(Guid id, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task InvalidateSubjectListsAsync(CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
