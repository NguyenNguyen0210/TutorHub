using MediatR;
using TutorHub.Application.Features.Conversations.DTOs;

namespace TutorHub.Application.Features.Admin.Conversations.AdminGetConversationMessages;

public record AdminGetConversationMessagesQuery(
    Guid ConversationId,
    string OperationalReason,
    string? Cursor = null,
    int PageSize = 50,
    Guid? DisputeId = null, Guid? ReportId = null, DateTime? FromDate = null, DateTime? ToDate = null
) : IRequest<CursorPagedResult<MessageDto>>;
