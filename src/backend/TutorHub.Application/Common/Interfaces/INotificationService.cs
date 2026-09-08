using TutorHub.Application.Features.Notifications.DTOs;

namespace TutorHub.Application.Common.Interfaces;

public interface INotificationService
{
    Task SendRealtimeNotificationAsync(Guid userId, NotificationDto notification, CancellationToken cancellationToken = default);
    Task UpdateRealtimeUnreadCountAsync(Guid userId, int unreadCount, CancellationToken cancellationToken = default);
}
