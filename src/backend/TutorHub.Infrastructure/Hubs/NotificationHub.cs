using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Infrastructure.Hubs;

[Authorize]
public class NotificationHub : Hub<INotificationClient>
{
    public override async Task OnConnectedAsync()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId.HasValue)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{currentUserId.Value}");
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
