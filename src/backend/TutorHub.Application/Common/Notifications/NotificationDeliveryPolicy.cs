using TutorHub.Application.Common.Events;

namespace TutorHub.Application.Common.Notifications;

public static class NotificationDeliveryPolicy
{
    private static readonly HashSet<string> EmailEnabledTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        // 1. Marketplace & Tutor Applications
        BusinessEventTypes.TutorApplicationSubmitted,
        BusinessEventTypes.TutorApplicationApproved,
        BusinessEventTypes.TutorApplicationRejected,

        // 2. Agreements, Custom Offers & Payments
        BusinessEventTypes.CustomOfferCreated,
        BusinessEventTypes.CustomOfferAccepted,
        BusinessEventTypes.PaymentSucceeded,
        BusinessEventTypes.EnrollmentActivated,
        BusinessEventTypes.EnrollmentCancelled,

        // 3. Sessions & Bilateral Attendance
        BusinessEventTypes.SessionScheduled,
        BusinessEventTypes.SessionRescheduled,
        BusinessEventTypes.SessionCancelled,
        BusinessEventTypes.AttendanceVerificationRequired,
        BusinessEventTypes.AttendanceConflictDetected,
        BusinessEventTypes.SessionCompleted,
        "SessionReminder",
        "AttendanceReminder",

        // 4. Financial, Payouts & Escrow
        BusinessEventTypes.EarningCreated,
        BusinessEventTypes.RefundCreated,
        BusinessEventTypes.RefundCompleted,
        BusinessEventTypes.RefundFailed,
        BusinessEventTypes.WithdrawalRequested,
        BusinessEventTypes.WithdrawalCompleted,
        BusinessEventTypes.WithdrawalFailed,

        // 5. Trust, Reviews & Disputes
        BusinessEventTypes.ReviewCreated,
        BusinessEventTypes.DisputeCreated,
        BusinessEventTypes.DisputeResolved,
        BusinessEventTypes.ReportCreated,

        // 6. Security, Identity & Authentication
        "AccountVerification",
        "PasswordChanged"
    };

    private static readonly HashSet<string> CriticalTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        BusinessEventTypes.PaymentSucceeded,
        BusinessEventTypes.EnrollmentActivated,
        BusinessEventTypes.EnrollmentCancelled,
        BusinessEventTypes.SessionCancelled,
        BusinessEventTypes.AttendanceConflictDetected,
        BusinessEventTypes.RefundCreated,
        BusinessEventTypes.RefundCompleted,
        BusinessEventTypes.RefundFailed,
        BusinessEventTypes.WithdrawalRequested,
        BusinessEventTypes.WithdrawalCompleted,
        BusinessEventTypes.WithdrawalFailed,
        BusinessEventTypes.DisputeCreated,
        BusinessEventTypes.DisputeResolved,
        "AccountVerification",
        "PasswordChanged"
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
