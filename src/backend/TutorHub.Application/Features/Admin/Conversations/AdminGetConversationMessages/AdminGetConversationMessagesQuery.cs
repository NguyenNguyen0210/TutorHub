using MediatR;
using TutorHub.Application.Features.Conversations.DTOs;

namespace TutorHub.Application.Features.Admin.Conversations.AdminGetConversationMessages;

public record AdminGetConversationMessagesQuery(
    Guid ConversationId,
    string OperationalReason,
    string? Cursor = null,
    int PageSize = 50
) : IRequest<CursorPagedResult<MessageDto>>;
