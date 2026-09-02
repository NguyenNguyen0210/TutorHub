namespace TutorHub.Application.Common.Events;

public static class BusinessEventTypes
{
    // 1. Marketplace (3 events)
    public const string TutorApplicationSubmitted = "TutorApplicationSubmitted";
    public const string TutorApplicationApproved = "TutorApplicationApproved";
    public const string TutorApplicationRejected = "TutorApplicationRejected";

    // 2. Enrollment & Agreements (5 events)
    public const string CustomOfferCreated = "CustomOfferCreated";
    public const string CustomOfferAccepted = "CustomOfferAccepted";
    public const string PaymentSucceeded = "PaymentSucceeded";
    public const string EnrollmentActivated = "EnrollmentActivated";
    public const string EnrollmentCancelled = "EnrollmentCancelled";

    // 3. Sessions & Attendance (6 events)
    public const string SessionScheduled = "SessionScheduled";
    public const string SessionRescheduled = "SessionRescheduled";
    public const string SessionCancelled = "SessionCancelled";
    public const string AttendanceVerificationRequired = "AttendanceVerificationRequired";
    public const string AttendanceConflictDetected = "AttendanceConflictDetected";
    public const string SessionCompleted = "SessionCompleted";

    // 4. Financial & Payouts (6 events)
    public const string EarningCreated = "EarningCreated";
    public const string RefundCreated = "RefundCreated";
    public const string RefundCompleted = "RefundCompleted";
    public const string WithdrawalRequested = "WithdrawalRequested";
    public const string WithdrawalCompleted = "WithdrawalCompleted";
    public const string WithdrawalFailed = "WithdrawalFailed";

    // 5. Trust, Safety & Disputes (4 events)
    public const string ReviewCreated = "ReviewCreated";
    public const string DisputeCreated = "DisputeCreated";
    public const string DisputeResolved = "DisputeResolved";
    public const string ReportCreated = "ReportCreated";

    // Communication Domain Event (Separate from 24 Core Business Events - INV-EVENT-009)
    public const string MessageSent = "MessageSent";
}
