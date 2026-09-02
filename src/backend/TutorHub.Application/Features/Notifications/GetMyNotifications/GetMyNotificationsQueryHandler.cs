using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Conversations.DTOs;
using TutorHub.Application.Features.Notifications.DTOs;

namespace TutorHub.Application.Features.Notifications.GetMyNotifications;

public class GetMyNotificationsQueryHandler : IRequestHandler<GetMyNotificationsQuery, CursorPagedResult<NotificationDto>>
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public GetMyNotificationsQueryHandler(
        IAppDbContext dbContext,
        ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task<CursorPagedResult<NotificationDto>> Handle(GetMyNotificationsQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || !_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var currentUserId = _currentUserService.UserId.Value;

        var query = _dbContext.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == currentUserId);

        if (request.UnreadOnly.HasValue && request.UnreadOnly.Value)
        {
            query = query.Where(n => !n.IsRead);
        }

        if (!string.IsNullOrWhiteSpace(request.Cursor))
        {
            if (TryParseCursor(request.Cursor, out var cursorCreatedAt, out var cursorId))
            {
                query = query.Where(n => 
                    n.CreatedAt < cursorCreatedAt ||
                    (n.CreatedAt == cursorCreatedAt && n.Id.CompareTo(cursorId) < 0));
            }
        }

        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .ThenByDescending(n => n.Id)
            .Take(pageSize + 1)
            .ToListAsync(cancellationToken);

        var hasMore = notifications.Count > pageSize;
        var items = notifications.Take(pageSize).ToList();

        var dtos = items.Select(n => new NotificationDto
        {
            Id = n.Id,
            UserId = n.UserId,
            Title = n.Title,
            Message = n.Message,
            Type = n.Type,
            DeepLink = n.DeepLink,
            IsRead = n.IsRead,
            ReadAt = n.ReadAt,
            IsCritical = n.IsCritical,
            EventId = n.EventId,
            DeduplicationKey = n.DeduplicationKey,
            CreatedAt = n.CreatedAt
        }).ToList();

        string? nextCursor = null;
        if (hasMore && items.Count > 0)
        {
            var lastItem = items[^1];
            nextCursor = CreateCursor(lastItem.CreatedAt, lastItem.Id);
        }

        return CursorPagedResult<NotificationDto>.Create(dtos, nextCursor, hasMore);
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
