using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Conversations.DTOs;

namespace TutorHub.Application.Features.Admin.Conversations.AdminGetConversations;

public class AdminGetConversationsQueryHandler : IRequestHandler<AdminGetConversationsQuery, CursorPagedResult<ConversationDto>>
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<AdminGetConversationsQueryHandler> _logger;

    public AdminGetConversationsQueryHandler(
        IAppDbContext dbContext,
        ICurrentUserService currentUserService,
        ILogger<AdminGetConversationsQueryHandler> logger)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task<CursorPagedResult<ConversationDto>> Handle(AdminGetConversationsQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || !_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        if (_currentUserService.Role != "Admin")
        {
            throw new ForbiddenException("Only administrators can access all conversations.");
        }

        if (string.IsNullOrWhiteSpace(request.OperationalReason) || request.OperationalReason.Trim().Length < 5)
        {
            throw new BadRequestException("A valid operational reason (at least 5 characters) is required.");
        }

        var adminUserId = _currentUserService.UserId.Value;

        // Structured Operational Security Logging (DEC-S7-016 / INV-MSG-005)
        _logger.LogInformation(
            "AdminOperationalAccess: Admin {AdminUserId} queried conversations list. Reason: {OperationalReason}, Timestamp: {Timestamp}",
            adminUserId,
            request.OperationalReason.Trim(),
            DateTime.UtcNow);

        var query = _dbContext.Conversations.AsNoTracking();

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
                    query = query.Where(c => c.LastMessageAt == null && c.Id.CompareTo(cursorId) < 0);
                }
            }
        }

        var pageSize = Math.Clamp(request.PageSize, 1, 50);

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
            UnreadCount = 0
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
