using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Notifications.DTOs;
using TutorHub.Infrastructure.Hubs;

namespace TutorHub.Infrastructure.Services;

public class SignalRNotificationService : INotificationService
{
    private readonly IHubContext<NotificationHub, INotificationClient> _hubContext;
    private readonly ILogger<SignalRNotificationService> _logger;

    public SignalRNotificationService(
        IHubContext<NotificationHub, INotificationClient> hubContext,
        ILogger<SignalRNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task SendRealtimeNotificationAsync(Guid userId, NotificationDto notification, CancellationToken cancellationToken = default)
    {
        try
        {
            await _hubContext.Clients.Group($"user_{userId}").ReceiveNotification(notification);
            await _hubContext.Clients.User(userId.ToString()).ReceiveNotification(notification);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to push realtime notification to user {UserId}", userId);
        }
    }

    public async Task UpdateRealtimeUnreadCountAsync(Guid userId, int unreadCount, CancellationToken cancellationToken = default)
    {
        try
        {
            await _hubContext.Clients.Group($"user_{userId}").ReceiveUnreadCount(unreadCount);
            await _hubContext.Clients.User(userId.ToString()).ReceiveUnreadCount(unreadCount);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to push realtime unread count to user {UserId}", userId);
        }
    }
}
