using MediatR;
using TutorHub.Application.Features.Conversations.DTOs;
using TutorHub.Application.Features.Notifications.DTOs;

namespace TutorHub.Application.Features.Notifications.GetMyNotifications;

public record GetMyNotificationsQuery(
    bool? UnreadOnly = null,
    string? Cursor = null,
    int PageSize = 20
) : IRequest<CursorPagedResult<NotificationDto>>;
