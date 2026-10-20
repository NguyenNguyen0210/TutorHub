using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Infrastructure.Hubs;

[Authorize]
public class ChatHub : Hub<IChatClient>
{
    private readonly IAppDbContext _dbContext;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(IAppDbContext dbContext, ILogger<ChatHub> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task JoinConversation(Guid conversationId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
        {
            throw new HubException("User is not authenticated.");
        }

        var conversation = await _dbContext.Conversations
            .Include(c => c.StudentProfile)
            .Include(c => c.TutorProfile)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == conversationId);

        if (conversation == null)
        {
            throw new HubException("Conversation not found.");
        }

        var isAdmin = Context.User?.IsInRole(UserRole.Admin.ToString()) ?? false;
        var isParticipant = conversation.StudentProfile.UserId == currentUserId.Value ||
                            conversation.TutorProfile.UserId == currentUserId.Value;

        if (!isParticipant && !isAdmin)
        {
            throw new HubException("You do not have access to this conversation.");
        }

        await AddToConversationGroupAsync($"conversation_{conversationId}");
    }

    public async Task LeaveConversation(Guid conversationId)
    {
        await RemoveFromConversationGroupAsync($"conversation_{conversationId}");
    }

    public async Task SendTyping(Guid conversationId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
        {
            throw new HubException("User is not authenticated.");
        }

        // Same participant-or-Admin gate as JoinConversation: group membership
        // alone must not authorize broadcasts.
        var conversation = await _dbContext.Conversations
            .Include(c => c.StudentProfile)
            .Include(c => c.TutorProfile)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == conversationId);

        if (conversation == null)
        {
            throw new HubException("Conversation not found.");
        }

        var isAdmin = Context.User?.IsInRole(UserRole.Admin.ToString()) ?? false;
        var isParticipant = conversation.StudentProfile.UserId == currentUserId.Value ||
                            conversation.TutorProfile.UserId == currentUserId.Value;

        if (!isParticipant && !isAdmin)
        {
            throw new HubException("You do not have access to this conversation.");
        }

        await Clients.OthersInGroup($"conversation_{conversationId}")
            .UserTyping(conversationId, currentUserId.Value);
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

    // WP2 local-degrade: group membership rides the Redis backplane when it is on.
    // A Redis outage must not fail the handshake or a join/leave call, so transport
    // failures are logged and the connection stays usable for local delivery.
    // Group names are unchanged.
    private async Task AddToConversationGroupAsync(string groupName)
    {
        try
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to join group {GroupName}; continuing local-only", groupName);
        }
    }

    private async Task RemoveFromConversationGroupAsync(string groupName)
    {
        try
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to leave group {GroupName}; continuing local-only", groupName);
        }
    }
}
