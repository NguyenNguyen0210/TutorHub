using MediatR;

namespace TutorHub.Application.Features.Conversations.MarkConversationAsRead;

public record MarkConversationAsReadCommand(
    Guid ConversationId
) : IRequest<int>;
