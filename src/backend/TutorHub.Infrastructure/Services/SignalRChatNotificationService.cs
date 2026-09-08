using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Conversations.DTOs;
using TutorHub.Infrastructure.Hubs;

namespace TutorHub.Infrastructure.Services;

public class SignalRChatNotificationService : IChatNotificationService
{
    private readonly IHubContext<ChatHub, IChatClient> _hubContext;
    private readonly ILogger<SignalRChatNotificationService> _logger;

    public SignalRChatNotificationService(
        IHubContext<ChatHub, IChatClient> hubContext,
        ILogger<SignalRChatNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task SendMessageRealtimeAsync(Guid conversationId, MessageDto message, CancellationToken cancellationToken = default)
    {
        try
        {
            await _hubContext.Clients.Group($"conversation_{conversationId}").ReceiveMessage(message);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to push realtime message to conversation group {ConversationId}", conversationId);
        }
    }

    public async Task SendMessageReadRealtimeAsync(Guid conversationId, Guid messageId, Guid readByUserId, CancellationToken cancellationToken = default)
    {
        try
        {
            await _hubContext.Clients.Group($"conversation_{conversationId}").MessageRead(conversationId, messageId, readByUserId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to push realtime message read event to conversation group {ConversationId}", conversationId);
        }
    }
}
