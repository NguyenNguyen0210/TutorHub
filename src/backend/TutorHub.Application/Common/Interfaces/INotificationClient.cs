using TutorHub.Application.Features.Notifications.DTOs;

namespace TutorHub.Application.Common.Interfaces;

public interface INotificationClient
{
    Task ReceiveNotification(NotificationDto notification);
    Task ReceiveUnreadCount(int unreadCount);
}
