using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Infrastructure.Hubs;

[Authorize]
public class NotificationHub : Hub<INotificationClient>
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId.HasValue)
        {
            // WP2 local-degrade: the user_ group join rides the Redis backplane when
            // it is on. A Redis outage must not fail the handshake (no 500), so a
            // transport failure is logged and the connection stays usable locally.
            // Group name is unchanged.
            try
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{currentUserId.Value}");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to join group user_{UserId}; continuing local-only", currentUserId.Value);
            }
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId.HasValue)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{currentUserId.Value}");
        }

        await base.OnDisconnectedAsync(exception);
    }

    private Guid? GetCurrentUserId()
    {
        var claim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Context.UserIdentifier;
        if (Guid.TryParse(claim, out var userId))
        {
            return userId;
        }
        return null;
    }
}
