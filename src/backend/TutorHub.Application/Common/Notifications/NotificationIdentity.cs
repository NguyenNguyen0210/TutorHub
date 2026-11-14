using TutorHub.Application.Common.Events;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Common.Notifications;

public static class NotificationIdentity
{
    public static string ForEvent(IBusinessEvent businessEvent) => businessEvent switch
    {
        GracePeriodStartedEvent e => $"session:{e.SessionId}:grace:{e.GracePeriodEndsAt.Ticks}",
        GracePeriodClosingSoonEvent e => $"session:{e.SessionId}:grace:{e.GracePeriodEndsAt.Ticks}",
        _ => $"event:{businessEvent.EventId}"
    };

    // Older workers could emit separate event IDs for the same grace reminder.
    // Keep one row without deleting history; apply before paging/unread filtering.
    public static IQueryable<Notification> VisibleToUser(this IQueryable<Notification> notifications, Guid userId) =>
        notifications.Where(n => n.UserId == userId &&
            ((n.Type != "GracePeriodStarted" && n.Type != "GracePeriodClosingSoon") || n.DeepLink == null ||
             !notifications.Any(other => other.UserId == userId && other.Type == n.Type &&
                 other.DeepLink == n.DeepLink && other.Message == n.Message &&
                 other.CreatedAt <= n.CreatedAt.AddMinutes(5) &&
                 (other.CreatedAt > n.CreatedAt || (other.CreatedAt == n.CreatedAt && other.Id.CompareTo(n.Id) > 0)))));
}
