using MediatR;
using TutorHub.Application.Features.Conversations.DTOs;

namespace TutorHub.Application.Features.Admin.Conversations.AdminGetConversations;

public record AdminGetConversationsQuery(
    string OperationalReason,
    string? Cursor = null,
    int PageSize = 20,
    Guid? DisputeId = null, Guid? ReportId = null, DateTime? FromDate = null, DateTime? ToDate = null
) : IRequest<CursorPagedResult<ConversationDto>>;
