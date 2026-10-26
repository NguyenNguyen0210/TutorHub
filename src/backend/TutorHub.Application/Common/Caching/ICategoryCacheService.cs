using TutorHub.Application.Features.Categories.DTOs;

namespace TutorHub.Application.Common.Caching;

/// <summary>
/// Read-through cache for public category tree and category detail reads.
/// Implementations fail open: any cache error falls back to the factory (the database).
/// </summary>
public interface ICategoryCacheService
{
    Task<IReadOnlyList<PublicCategoryDto>> GetPublicCategoriesAsync(
        Func<Task<IReadOnlyList<PublicCategoryDto>>> factory,
        CancellationToken cancellationToken = default);

    Task<PublicCategoryDto?> GetCategoryAsync(
        Guid id,
        Func<Task<PublicCategoryDto?>> factory,
        CancellationToken cancellationToken = default);

    /// <summary>Bumps the category tree version so any cached category listings refresh.</summary>
    Task InvalidateCategoriesAsync(CancellationToken cancellationToken = default);

    /// <summary>Bumps the category tree version and drops the detail entry for one category.</summary>
    Task InvalidateCategoryAsync(Guid id, CancellationToken cancellationToken = default);
}

/// <summary>
/// Pass-through used when the cache is disabled: always hits the database,
/// so disabled mode behaves byte-identically to uncached code.
/// </summary>
public sealed class NoOpCategoryCacheService : ICategoryCacheService
{
    public static readonly NoOpCategoryCacheService Instance = new();

    private NoOpCategoryCacheService()
    {
    }

    public Task<IReadOnlyList<PublicCategoryDto>> GetPublicCategoriesAsync(
        Func<Task<IReadOnlyList<PublicCategoryDto>>> factory,
        CancellationToken cancellationToken = default) => factory();

    public Task<PublicCategoryDto?> GetCategoryAsync(
        Guid id,
        Func<Task<PublicCategoryDto?>> factory,
        CancellationToken cancellationToken = default) => factory();

    public Task InvalidateCategoriesAsync(CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task InvalidateCategoryAsync(Guid id, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}

