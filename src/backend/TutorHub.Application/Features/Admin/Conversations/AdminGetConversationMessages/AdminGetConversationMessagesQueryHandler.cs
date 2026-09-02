using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Conversations.DTOs;

namespace TutorHub.Application.Features.Admin.Conversations.AdminGetConversationMessages;

public class AdminGetConversationMessagesQueryHandler : IRequestHandler<AdminGetConversationMessagesQuery, CursorPagedResult<MessageDto>>
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<AdminGetConversationMessagesQueryHandler> _logger;

    public AdminGetConversationMessagesQueryHandler(
        IAppDbContext dbContext,
        ICurrentUserService currentUserService,
        ILogger<AdminGetConversationMessagesQueryHandler> logger)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task<CursorPagedResult<MessageDto>> Handle(AdminGetConversationMessagesQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || !_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        if (_currentUserService.Role != "Admin")
        {
            throw new ForbiddenException("Only administrators can access conversation messages via admin endpoint.");
        }

        if (string.IsNullOrWhiteSpace(request.OperationalReason) || request.OperationalReason.Trim().Length < 5)
        {
            throw new BadRequestException("A valid operational reason (at least 5 characters) is required.");
        }

        var adminUserId = _currentUserService.UserId.Value;

        var conversation = await _dbContext.Conversations
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == request.ConversationId, cancellationToken);

        if (conversation == null)
        {
            throw new NotFoundException($"Conversation with ID '{request.ConversationId}' not found.");
        }

        // Structured Operational Security Logging (DEC-S7-016 / INV-MSG-005)
        _logger.LogInformation(
            "AdminOperationalAccess: Admin {AdminUserId} queried messages for Conversation {ConversationId}. Reason: {OperationalReason}, Timestamp: {Timestamp}",
            adminUserId,
            request.ConversationId,
            request.OperationalReason.Trim(),
            DateTime.UtcNow);

        var query = _dbContext.Messages
            .AsNoTracking()
            .Where(m => m.ConversationId == request.ConversationId);

        if (!string.IsNullOrWhiteSpace(request.Cursor))
        {
            if (TryParseCursor(request.Cursor, out var cursorCreatedAt, out var cursorId))
            {
                query = query.Where(m => 
                    m.CreatedAt < cursorCreatedAt ||
                    (m.CreatedAt == cursorCreatedAt && m.Id.CompareTo(cursorId) < 0));
            }
        }

        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var messages = await query
            .OrderByDescending(m => m.CreatedAt)
            .ThenByDescending(m => m.Id)
            .Take(pageSize + 1)
            .Include(m => m.SenderUser)
            .ToListAsync(cancellationToken);

        var hasMore = messages.Count > pageSize;
        var items = messages.Take(pageSize).ToList();

        var dtos = items.Select(m => new MessageDto
        {
            Id = m.Id,
            ConversationId = m.ConversationId,
            SenderUserId = m.SenderUserId,
            SenderName = m.SenderUser?.FullName ?? string.Empty,
            SenderAvatarUrl = m.SenderUser?.AvatarUrl,
            Content = m.Content,
            AttachmentKey = m.AttachmentKey,
            AttachmentName = m.AttachmentName,
            AttachmentContentType = m.AttachmentContentType,
            AttachmentSize = m.AttachmentSize,
            IsRead = m.IsRead,
            ReadAt = m.ReadAt,
            CreatedAt = m.CreatedAt
        }).ToList();

        string? nextCursor = null;
        if (hasMore && items.Count > 0)
        {
            var lastItem = items[^1];
            nextCursor = CreateCursor(lastItem.CreatedAt, lastItem.Id);
        }

        return CursorPagedResult<MessageDto>.Create(dtos, nextCursor, hasMore);
    }

    private static string CreateCursor(DateTime createdAt, Guid id)
    {
        var raw = $"{createdAt.Ticks}_{id}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(raw));
    }

    private static bool TryParseCursor(string cursor, out DateTime createdAt, out Guid id)
    {
        createdAt = DateTime.MinValue;
        id = Guid.Empty;
        try
        {
            var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(cursor));
            var parts = decoded.Split('_');
            if (parts.Length != 2) return false;

            if (long.TryParse(parts[0], out var ticks))
            {
                createdAt = new DateTime(ticks, DateTimeKind.Utc);
                return Guid.TryParse(parts[1], out id);
            }

            return false;
        }
        catch
        {
            return false;
        }
    }
}
