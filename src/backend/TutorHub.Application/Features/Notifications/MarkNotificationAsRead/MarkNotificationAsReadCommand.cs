using MediatR;

namespace TutorHub.Application.Features.Notifications.MarkNotificationAsRead;

public record MarkNotificationAsReadCommand(Guid NotificationId) : IRequest<bool>;
