namespace TutorHub.Application.Common.Events;

// ==========================================
// 1. Marketplace Events (3)
// ==========================================
public record TutorApplicationSubmittedEvent(
    Guid ApplicationId,
    Guid TutorUserId,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.TutorApplicationSubmitted;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "TutorApplication";
    public Guid AggregateId => ApplicationId;
}

public record TutorApplicationApprovedEvent(
    Guid ApplicationId,
    Guid TutorUserId,
    Guid AdminId,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.TutorApplicationApproved;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "TutorApplication";
    public Guid AggregateId => ApplicationId;
}

public record TutorApplicationRejectedEvent(
    Guid ApplicationId,
    Guid TutorUserId,
    string Reason,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.TutorApplicationRejected;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "TutorApplication";
    public Guid AggregateId => ApplicationId;
}

// ==========================================
// 2. Enrollment & Agreements Events (5)
// ==========================================
public record CustomOfferCreatedEvent(
    Guid AgreementId,
    Guid TutorId,
    Guid StudentId,
    Guid StudentUserId,
    Guid TutorUserId,
    MoneyDto TotalPrice,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.CustomOfferCreated;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "CustomAgreement";
    public Guid AggregateId => AgreementId;
}

public record CustomOfferAcceptedEvent(
    Guid AgreementId,
    Guid TutorId,
    Guid StudentId,
    Guid StudentUserId,
    Guid TutorUserId,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.CustomOfferAccepted;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "CustomAgreement";
    public Guid AggregateId => AgreementId;
}

public record PaymentSucceededEvent(
    Guid BookingId,
    Guid StudentUserId,
    MoneyDto Amount,
    Guid EnrollmentId,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.PaymentSucceeded;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Booking";
    public Guid AggregateId => BookingId;
}

public record EnrollmentActivatedEvent(
    Guid EnrollmentId,
    Guid StudentId,
    Guid TutorId,
    Guid StudentUserId,
    Guid TutorUserId,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.EnrollmentActivated;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Enrollment";
    public Guid AggregateId => EnrollmentId;
}

public record EnrollmentCancelledEvent(
    Guid EnrollmentId,
    Guid StudentUserId,
    Guid TutorUserId,
    Guid CancelledByUserId,
    string Reason,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.EnrollmentCancelled;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Enrollment";
    public Guid AggregateId => EnrollmentId;
}

// ==========================================
// 3. Sessions & Attendance Events (6)
// ==========================================
public record SessionScheduledEvent(
    Guid SessionId,
    Guid EnrollmentId,
    Guid StudentUserId,
    Guid TutorUserId,
    DateTime StartAt,
    DateTime EndAt,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.SessionScheduled;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Session";
    public Guid AggregateId => SessionId;
}

public record SessionRescheduledEvent(
    Guid SessionId,
    Guid EnrollmentId,
    Guid StudentUserId,
    Guid TutorUserId,
    DateTime PreviousStartAt,
    DateTime PreviousEndAt,
    DateTime NewStartAt,
    DateTime NewEndAt,
    Guid? RescheduleRequestId = null,
    Guid? AcceptedByUserId = null,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public DateTime OldStartAt => PreviousStartAt; // Backwards-compatible alias
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.SessionRescheduled;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Session";
    public Guid AggregateId => SessionId;
}

public record SessionCancelledEvent(
    Guid SessionId,
    Guid EnrollmentId,
    Guid StudentUserId,
    Guid TutorUserId,
    string Reason,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.SessionCancelled;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Session";
    public Guid AggregateId => SessionId;
}

public record AttendanceVerificationRequiredEvent(
    Guid SessionId,
    Guid EnrollmentId,
    Guid StudentUserId,
    Guid TutorUserId,
    DateTime DueAt,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.AttendanceVerificationRequired;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Session";
    public Guid AggregateId => SessionId;
}

public record AttendanceConflictDetectedEvent(
    Guid SessionId,
    Guid EnrollmentId,
    Guid StudentUserId,
    Guid TutorUserId,
    string StudentStatus,
    string TutorStatus,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.AttendanceConflictDetected;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Session";
    public Guid AggregateId => SessionId;
}

public record SessionCompletedEvent(
    Guid SessionId,
    Guid EnrollmentId,
    Guid StudentUserId,
    Guid TutorUserId,
    MoneyDto EarningAmount,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.SessionCompleted;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Session";
    public Guid AggregateId => SessionId;
}

// ==========================================
// 4. Financial & Payout Events (6)
// ==========================================
public record EarningCreatedEvent(
    Guid SessionId,
    Guid TutorProfileId,
    Guid TutorUserId,
    MoneyDto Gross,
    MoneyDto Fee,
    MoneyDto NetPayout,
    Guid TransactionId,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.EarningCreated;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "WalletTransaction";
    public Guid AggregateId => TransactionId;
}

public record RefundCreatedEvent(
    Guid EnrollmentId,
    Guid StudentUserId,
    MoneyDto Amount,
    Guid TransactionId,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.RefundCreated;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Transaction";
    public Guid AggregateId => TransactionId;
}

public record RefundCompletedEvent(
    Guid EnrollmentId,
    Guid StudentUserId,
    MoneyDto Amount,
    Guid TransactionId,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.RefundCompleted;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Transaction";
    public Guid AggregateId => TransactionId;
}

public record RefundFailedEvent(
    Guid EnrollmentId,
    Guid StudentUserId,
    MoneyDto Amount,
    Guid TransactionId,
    string Reason,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.RefundFailed;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Transaction";
    public Guid AggregateId => TransactionId;
}

public record WithdrawalRequestedEvent(
    Guid WithdrawalId,
    Guid TutorProfileId,
    Guid TutorUserId,
    MoneyDto Amount,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.WithdrawalRequested;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Withdrawal";
    public Guid AggregateId => WithdrawalId;
}

public record WithdrawalCompletedEvent(
    Guid WithdrawalId,
    Guid TutorProfileId,
    Guid TutorUserId,
    MoneyDto Amount,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.WithdrawalCompleted;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Withdrawal";
    public Guid AggregateId => WithdrawalId;
}

public record WithdrawalFailedEvent(
    Guid WithdrawalId,
    Guid TutorProfileId,
    Guid TutorUserId,
    MoneyDto Amount,
    string Reason,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.WithdrawalFailed;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Withdrawal";
    public Guid AggregateId => WithdrawalId;
}

// ==========================================
// 5. Trust, Safety & Disputes Events (4)
// ==========================================
public record ReviewCreatedEvent(
    Guid ReviewId,
    Guid EnrollmentId,
    Guid TutorId,
    Guid TutorUserId,
    Guid StudentUserId,
    int Rating,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.ReviewCreated;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Review";
    public Guid AggregateId => ReviewId;
}

public record DisputeCreatedEvent(
    Guid DisputeId,
    Guid EnrollmentId,
    Guid RaisedByUserId,
    Guid TargetUserId,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.DisputeCreated;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Dispute";
    public Guid AggregateId => DisputeId;
}

public record DisputeResolvedEvent(
    Guid DisputeId,
    Guid EnrollmentId,
    Guid StudentUserId,
    Guid TutorUserId,
    string Resolution,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.DisputeResolved;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Dispute";
    public Guid AggregateId => DisputeId;
}

public record ReportCreatedEvent(
    Guid ReportId,
    Guid ReporterUserId,
    Guid TargetUserId,
    string Reason,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.ReportCreated;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Report";
    public Guid AggregateId => ReportId;
}

public record ReportResolvedEvent(
    Guid ReportId,
    Guid ReportedUserId,
    Guid ReporterUserId,
    string Decision,
    string Resolution,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.ReportResolved;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Report";
    public Guid AggregateId => ReportId;
}

// ==========================================
// Communication Domain Event
// ==========================================
public record MessageSentEvent(
    Guid MessageId,
    Guid ConversationId,
    Guid SenderUserId,
    Guid RecipientUserId,
    string Content,
    string? AttachmentKey = null,
    string? AttachmentName = null,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.MessageSent;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Conversation";
    public Guid AggregateId => ConversationId;
}

public record PlatformSettingChangedEvent(
    string SettingKey,
    string OldValue,
    string NewValue,
    int Version,
    Guid ChangedByAdminId,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.PlatformSettingChanged;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "PlatformSetting";
    public Guid AggregateId => Guid.Empty;
}

// ==========================================
// 6. Student Wallet & Top-up Events
// ==========================================
public record StudentTopUpRequestedEvent(
    Guid TopUpRequestId,
    Guid StudentProfileId,
    Guid StudentUserId,
    MoneyDto Amount,
    string TransferReference,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.StudentTopUpRequested;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "TopUpRequest";
    public Guid AggregateId => TopUpRequestId;
}

public record StudentTopUpConfirmedEvent(
    Guid TopUpRequestId,
    Guid StudentProfileId,
    Guid StudentUserId,
    MoneyDto Amount,
    Guid AdminId,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.StudentTopUpConfirmed;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "TopUpRequest";
    public Guid AggregateId => TopUpRequestId;
}

public record StudentTopUpRejectedEvent(
    Guid TopUpRequestId,
    Guid StudentProfileId,
    Guid StudentUserId,
    string Reason,
    Guid AdminId,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.StudentTopUpRejected;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "TopUpRequest";
    public Guid AggregateId => TopUpRequestId;
}

public record StudentWalletPaymentSucceededEvent(
    Guid BookingId,
    Guid StudentProfileId,
    Guid StudentUserId,
    MoneyDto Amount,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.StudentWalletPaymentSucceeded;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "Booking";
    public Guid AggregateId => BookingId;
}

public record StudentWithdrawalRequestedEvent(
    Guid WithdrawalId,
    Guid StudentProfileId,
    Guid StudentUserId,
    MoneyDto Amount,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.StudentWithdrawalRequested;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "StudentWithdrawal";
    public Guid AggregateId => WithdrawalId;
}

public record StudentWithdrawalCompletedEvent(
    Guid WithdrawalId,
    Guid StudentProfileId,
    Guid StudentUserId,
    MoneyDto Amount,
    Guid AdminId,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.StudentWithdrawalCompleted;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "StudentWithdrawal";
    public Guid AggregateId => WithdrawalId;
}

public record StudentWithdrawalFailedEvent(
    Guid WithdrawalId,
    Guid StudentProfileId,
    Guid StudentUserId,
    MoneyDto Amount,
    string Reason,
    Guid AdminId,
    Guid EventId = default,
    int EventVersion = 1,
    DateTime OccurredAt = default
) : IBusinessEvent
{
    public Guid EventId { get; init; } = EventId == default ? Guid.NewGuid() : EventId;
    public string EventType => BusinessEventTypes.StudentWithdrawalFailed;
    public int EventVersion { get; init; } = EventVersion;
    public DateTime OccurredAt { get; init; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
    public string AggregateType => "StudentWithdrawal";
    public Guid AggregateId => WithdrawalId;
}

