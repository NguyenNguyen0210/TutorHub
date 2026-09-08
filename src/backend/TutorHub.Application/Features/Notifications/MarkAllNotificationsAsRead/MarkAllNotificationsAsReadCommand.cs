using MediatR;

namespace TutorHub.Application.Features.Notifications.MarkAllNotificationsAsRead;

public record MarkAllNotificationsAsReadCommand : IRequest<int>;
