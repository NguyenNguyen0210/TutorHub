namespace TutorHub.Application.Common.Caching;

/// <summary>Smallest unit cached for a platform setting: value plus its version.</summary>
public sealed record PlatformSettingSnapshot(string Key, string Value, int CurrentVersion);

/// <summary>
/// Read-through cache for platform settings. Failures are never cached and any
/// cache error falls back to the factory (the database).
/// </summary>
public interface IPlatformSettingCacheService
{
    Task<PlatformSettingSnapshot?> GetSettingAsync(
        string key,
        Func<CancellationToken, Task<PlatformSettingSnapshot?>> factory,
        CancellationToken cancellationToken = default);

    Task RemoveSettingAsync(string key, CancellationToken cancellationToken = default);
}

/// <summary>
/// Pass-through used when the cache is disabled: always hits the database.
/// </summary>
public sealed class NoOpPlatformSettingCacheService : IPlatformSettingCacheService
{
    public static readonly NoOpPlatformSettingCacheService Instance = new();

    private NoOpPlatformSettingCacheService()
    {
    }

    public Task<PlatformSettingSnapshot?> GetSettingAsync(
        string key,
        Func<CancellationToken, Task<PlatformSettingSnapshot?>> factory,
        CancellationToken cancellationToken = default) => factory(cancellationToken);

    public Task RemoveSettingAsync(string key, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
