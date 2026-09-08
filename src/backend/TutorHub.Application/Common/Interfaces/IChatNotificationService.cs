using TutorHub.Application.Features.Conversations.DTOs;

namespace TutorHub.Application.Common.Interfaces;

public interface IChatNotificationService
{
    Task SendMessageRealtimeAsync(Guid conversationId, MessageDto message, CancellationToken cancellationToken = default);
    Task SendMessageReadRealtimeAsync(Guid conversationId, Guid messageId, Guid readByUserId, CancellationToken cancellationToken = default);
}
