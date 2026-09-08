namespace TutorHub.Application.Common.Notifications;

/// <summary>
/// Canonical Server-Side Notification Route Registry (DEC-S7-007, INV-NOTIF-006).
/// Generates uniform deep links as navigation hints for client navigation.
/// Target endpoints independently enforce security and authorization (INV-NOTIF-007).
/// </summary>
public static class NotificationRouteRegistry
{
    public static string AdminTutorApplication(Guid applicationId) => $"/admin/tutor-applications/{applicationId}";
    public static string TutorProfileMine() => "/tutor/profile";
    public static string TutorApplicationMine() => "/tutor/application";
    public static string Agreement(Guid agreementId) => $"/agreements/{agreementId}";
    public static string Enrollment(Guid enrollmentId) => $"/enrollments/{enrollmentId}";
    public static string Session(Guid sessionId) => $"/sessions/{sessionId}";
    public static string WalletTransaction(Guid transactionId) => $"/wallet/transactions/{transactionId}";
    public static string WalletWithdrawals() => "/wallet/withdrawals";
    public static string AdminWithdrawal(Guid withdrawalId) => $"/admin/withdrawals/{withdrawalId}";
    public static string TutorReviews() => "/tutor/reviews";
    public static string AdminDispute(Guid disputeId) => $"/admin/disputes/{disputeId}";
    public static string AdminReport(Guid reportId) => $"/admin/reports/{reportId}";
    public static string Conversation(Guid conversationId) => $"/conversations/{conversationId}";
}
