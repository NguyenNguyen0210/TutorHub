using TutorHub.Application.Common.Events;

namespace TutorHub.Application.Common.Notifications;

public static class NotificationDeliveryPolicy
{
    private static readonly HashSet<string> EmailEnabledTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        BusinessEventTypes.TutorApplicationSubmitted,
        BusinessEventTypes.TutorApplicationApproved,
        BusinessEventTypes.TutorApplicationRejected,
        BusinessEventTypes.PaymentSucceeded,
        BusinessEventTypes.EnrollmentActivated,
        BusinessEventTypes.EnrollmentCancelled,
        BusinessEventTypes.RefundCreated,
        BusinessEventTypes.RefundCompleted,
        BusinessEventTypes.WithdrawalRequested,
        BusinessEventTypes.WithdrawalCompleted,
        BusinessEventTypes.WithdrawalFailed,
        BusinessEventTypes.DisputeCreated,
        BusinessEventTypes.DisputeResolved,
        "SessionReminder",
        "AttendanceReminder"
    };

    private static readonly HashSet<string> CriticalTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        BusinessEventTypes.PaymentSucceeded,
        BusinessEventTypes.RefundCreated,
        BusinessEventTypes.RefundCompleted,
        BusinessEventTypes.WithdrawalRequested,
        BusinessEventTypes.WithdrawalCompleted,
        BusinessEventTypes.WithdrawalFailed,
        BusinessEventTypes.DisputeCreated,
        BusinessEventTypes.DisputeResolved
    };

    public static bool ShouldSendEmail(string notificationType)
    {
        return EmailEnabledTypes.Contains(notificationType);
    }

    public static bool IsCriticalNotification(string notificationType)
    {
        return CriticalTypes.Contains(notificationType);
    }

    public static bool ShouldSendRealtime(string notificationType)
    {
        // MessageSent uses ChatHub, others use NotificationHub
        return !string.Equals(notificationType, BusinessEventTypes.MessageSent, StringComparison.OrdinalIgnoreCase);
    }
}
