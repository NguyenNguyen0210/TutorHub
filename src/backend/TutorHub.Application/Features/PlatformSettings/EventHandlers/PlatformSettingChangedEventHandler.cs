using MediatR;
using TutorHub.Application.Common.Caching;
using TutorHub.Application.Common.Events;

namespace TutorHub.Application.Features.PlatformSettings.EventHandlers;

/// <summary>
/// WP5: a changed platform setting drops its cached entry so the next read
/// (e.g. enrollment activation snapshotting the fee rate) sees the new value.
/// Runs via the outbox dispatcher after the change commits.
/// </summary>
public class PlatformSettingChangedEventHandler : INotificationHandler<PlatformSettingChangedEvent>
{
    private readonly IPlatformSettingCacheService _cache;

    public PlatformSettingChangedEventHandler(IPlatformSettingCacheService cache)
    {
        _cache = cache;
    }

    public Task Handle(PlatformSettingChangedEvent notification, CancellationToken cancellationToken) =>
        _cache.RemoveSettingAsync(notification.SettingKey, cancellationToken);
}
