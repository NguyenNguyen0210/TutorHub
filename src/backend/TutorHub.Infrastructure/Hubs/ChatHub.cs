using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Infrastructure.Hubs;

[Authorize]
public class ChatHub : Hub<IChatClient>
{
    private readonly IAppDbContext _dbContext;

    public ChatHub(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
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

        await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
    }

    public async Task LeaveConversation(Guid conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
    }

    public async Task SendTyping(Guid conversationId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId != null)
        {
            await Clients.OthersInGroup($"conversation_{conversationId}")
                .UserTyping(conversationId, currentUserId.Value);
        }
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
