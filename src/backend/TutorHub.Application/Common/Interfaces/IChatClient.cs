using TutorHub.Application.Features.Conversations.DTOs;

namespace TutorHub.Application.Common.Interfaces;

public interface IChatClient
{
    Task ReceiveMessage(MessageDto message);
    Task MessageRead(Guid conversationId, Guid messageId, Guid readByUserId);
    Task UserTyping(Guid conversationId, Guid userId);
}
