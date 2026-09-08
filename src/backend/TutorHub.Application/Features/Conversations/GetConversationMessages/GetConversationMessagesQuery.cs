using MediatR;
using TutorHub.Application.Features.Conversations.DTOs;

namespace TutorHub.Application.Features.Conversations.GetConversationMessages;

public record GetConversationMessagesQuery(
    Guid ConversationId,
    string? Cursor = null,
    int PageSize = 50
) : IRequest<CursorPagedResult<MessageDto>>;
