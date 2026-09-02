using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Conversations.DTOs;

namespace TutorHub.Application.Features.Conversations.GetMyConversations;

public class GetMyConversationsQueryHandler : IRequestHandler<GetMyConversationsQuery, CursorPagedResult<ConversationDto>>
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public GetMyConversationsQueryHandler(
        IAppDbContext dbContext,
        ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task<CursorPagedResult<ConversationDto>> Handle(GetMyConversationsQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || !_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var currentUserId = _currentUserService.UserId.Value;

        // Find user's profile IDs
        var studentProfileId = await _dbContext.StudentProfiles
            .Where(sp => sp.UserId == currentUserId)
            .Select(sp => (Guid?)sp.Id)
            .FirstOrDefaultAsync(cancellationToken);

        var tutorProfileId = await _dbContext.TutorProfiles
            .Where(tp => tp.UserId == currentUserId)
            .Select(tp => (Guid?)tp.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (!studentProfileId.HasValue && !tutorProfileId.HasValue)
        {
            return CursorPagedResult<ConversationDto>.Create(Array.Empty<ConversationDto>(), null, false);
        }

        var query = _dbContext.Conversations
            .AsNoTracking()
            .Where(c => (studentProfileId.HasValue && c.StudentProfileId == studentProfileId.Value) ||
                        (tutorProfileId.HasValue && c.TutorProfileId == tutorProfileId.Value));

        // Parse cursor if provided: "{lastMessageAtUtcTicks}_{id}"
        if (!string.IsNullOrWhiteSpace(request.Cursor))
        {
            if (TryParseCursor(request.Cursor, out var cursorLastMessageAt, out var cursorId))
            {
                if (cursorLastMessageAt.HasValue)
                {
                    query = query.Where(c => 
                        c.LastMessageAt == null ||
                        c.LastMessageAt < cursorLastMessageAt.Value ||
                        (c.LastMessageAt == cursorLastMessageAt.Value && c.Id.CompareTo(cursorId) < 0));
                }
                else
                {
                    // If cursor was on a null LastMessageAt item, only items with null LastMessageAt and Id < cursorId
                    query = query.Where(c => c.LastMessageAt == null && c.Id.CompareTo(cursorId) < 0);
                }
            }
        }

        var pageSize = Math.Clamp(request.PageSize, 1, 50);

        // Sort: conversations with messages first (by LastMessageAt DESC, Id DESC), then conversations with null LastMessageAt (by Id DESC)
        var conversations = await query
            .OrderByDescending(c => c.LastMessageAt.HasValue)
            .ThenByDescending(c => c.LastMessageAt)
            .ThenByDescending(c => c.Id)
            .Take(pageSize + 1)
            .Include(c => c.StudentProfile).ThenInclude(sp => sp.User)
            .Include(c => c.TutorProfile).ThenInclude(tp => tp.User)
            .ToListAsync(cancellationToken);

        var hasMore = conversations.Count > pageSize;
        var items = conversations.Take(pageSize).ToList();

        // Get unread message counts for each conversation
        var conversationIds = items.Select(c => c.Id).ToList();
        var unreadCounts = await _dbContext.Messages
            .AsNoTracking()
            .Where(m => conversationIds.Contains(m.ConversationId) && m.SenderUserId != currentUserId && !m.IsRead)
            .GroupBy(m => m.ConversationId)
            .Select(g => new { ConversationId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ConversationId, x => x.Count, cancellationToken);

        var dtos = items.Select(c => new ConversationDto
        {
            Id = c.Id,
            StudentProfileId = c.StudentProfileId,
            StudentUserId = c.StudentProfile.UserId,
            StudentName = c.StudentProfile.User?.FullName ?? string.Empty,
            StudentAvatarUrl = c.StudentProfile.User?.AvatarUrl,
            TutorProfileId = c.TutorProfileId,
            TutorUserId = c.TutorProfile.UserId,
            TutorName = c.TutorProfile.User?.FullName ?? string.Empty,
            TutorAvatarUrl = c.TutorProfile.User?.AvatarUrl,
            CreatedAt = c.CreatedAt,
            LastMessageId = c.LastMessageId,
            LastMessageAt = c.LastMessageAt,
            LastMessagePreview = c.LastMessagePreview,
            UnreadCount = unreadCounts.GetValueOrDefault(c.Id, 0)
        }).ToList();

        string? nextCursor = null;
        if (hasMore && items.Count > 0)
        {
            var lastItem = items[^1];
            nextCursor = CreateCursor(lastItem.LastMessageAt, lastItem.Id);
        }

        return CursorPagedResult<ConversationDto>.Create(dtos, nextCursor, hasMore);
    }

    private static string CreateCursor(DateTime? lastMessageAt, Guid id)
    {
        var raw = $"{lastMessageAt?.Ticks.ToString() ?? "null"}_{id}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(raw));
    }

    private static bool TryParseCursor(string cursor, out DateTime? lastMessageAt, out Guid id)
    {
        lastMessageAt = null;
        id = Guid.Empty;
        try
        {
            var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(cursor));
            var parts = decoded.Split('_');
            if (parts.Length != 2) return false;

            if (parts[0] != "null" && long.TryParse(parts[0], out var ticks))
            {
                lastMessageAt = new DateTime(ticks, DateTimeKind.Utc);
            }

            return Guid.TryParse(parts[1], out id);
        }
        catch
        {
            return false;
        }
    }
}
