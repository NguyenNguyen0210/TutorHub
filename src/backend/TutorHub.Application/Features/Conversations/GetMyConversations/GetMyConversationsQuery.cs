using MediatR;
using TutorHub.Application.Features.Conversations.DTOs;

namespace TutorHub.Application.Features.Conversations.GetMyConversations;

public record GetMyConversationsQuery(
    string? Cursor = null,
    int PageSize = 20
) : IRequest<CursorPagedResult<ConversationDto>>;
