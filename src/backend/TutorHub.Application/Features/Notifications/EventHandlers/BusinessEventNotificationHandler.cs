using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Notifications;
using TutorHub.Application.Features.Notifications.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Notifications.EventHandlers;

public class BusinessEventNotificationHandler :
    INotificationHandler<TutorApplicationSubmittedEvent>,
    INotificationHandler<TutorApplicationApprovedEvent>,
    INotificationHandler<TutorApplicationRejectedEvent>,
    INotificationHandler<CustomOfferCreatedEvent>,
    INotificationHandler<CustomOfferAcceptedEvent>,
    INotificationHandler<PaymentSucceededEvent>,
    INotificationHandler<EnrollmentActivatedEvent>,
    INotificationHandler<EnrollmentCancelledEvent>,
    INotificationHandler<SessionScheduledEvent>,
    INotificationHandler<SessionRescheduledEvent>,
    INotificationHandler<SessionCancelledEvent>,
    INotificationHandler<AttendanceVerificationRequiredEvent>,
    INotificationHandler<AttendanceConflictDetectedEvent>,
    INotificationHandler<SessionCompletedEvent>,
    INotificationHandler<EarningCreatedEvent>,
    INotificationHandler<WithdrawalRequestedEvent>,
    INotificationHandler<WithdrawalCompletedEvent>,
    INotificationHandler<WithdrawalFailedEvent>,
    INotificationHandler<RefundCreatedEvent>,
    INotificationHandler<RefundCompletedEvent>,
    INotificationHandler<ReviewCreatedEvent>,
    INotificationHandler<DisputeCreatedEvent>,
    INotificationHandler<DisputeResolvedEvent>,
    INotificationHandler<ReportCreatedEvent>
{
    private readonly IAppDbContext _dbContext;
    private readonly INotificationService? _notificationService;
    private readonly ILogger<BusinessEventNotificationHandler> _logger;

    public BusinessEventNotificationHandler(
        IAppDbContext dbContext,
        ILogger<BusinessEventNotificationHandler> logger,
        INotificationService? notificationService = null)
    {
        _dbContext = dbContext;
        _logger = logger;
        _notificationService = notificationService;
    }

    private async Task<bool> IsAlreadyProcessedAsync(Guid eventId, CancellationToken cancellationToken)
    {
        return await _dbContext.InboxMessages
            .AnyAsync(i => i.ConsumerName == "NotificationConsumer" && i.EventId == eventId, cancellationToken);
    }

    public async Task Handle(TutorApplicationSubmittedEvent notification, CancellationToken cancellationToken)
    {
        if (await IsAlreadyProcessedAsync(notification.EventId, cancellationToken))
        {
            return;
        }

        var adminUserIds = await _dbContext.Users
            .Where(u => u.Role == UserRole.Admin)
            .Select(u => u.Id)
            .ToListAsync(cancellationToken);

        var recipients = adminUserIds.Select(adminId => (
            UserId: adminId,
            Title: "New Tutor Application Submitted",
            Message: "A new tutor application has been submitted and is awaiting your review.",
            DeepLink: NotificationRouteRegistry.AdminTutorApplication(notification.ApplicationId)
        ));

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(TutorApplicationApprovedEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.TutorUserId,
                Title: "Tutor Application Approved",
                Message: "Congratulations! Your application to become a tutor on TutorHub has been approved.",
                DeepLink: NotificationRouteRegistry.TutorProfileMine()
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(TutorApplicationRejectedEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.TutorUserId,
                Title: "Tutor Application Update",
                Message: $"Your tutor application was not approved. Reason: {notification.Reason}",
                DeepLink: NotificationRouteRegistry.TutorApplicationMine()
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(CustomOfferCreatedEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.StudentUserId,
                Title: "New Custom Agreement Offer",
                Message: $"You received a custom tutoring offer for {notification.TotalPrice.Amount:N0} VND.",
                DeepLink: NotificationRouteRegistry.Agreement(notification.AgreementId)
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(CustomOfferAcceptedEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.TutorUserId,
                Title: "Custom Agreement Accepted",
                Message: "The student has accepted your custom tutoring offer.",
                DeepLink: NotificationRouteRegistry.Agreement(notification.AgreementId)
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(PaymentSucceededEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.StudentUserId,
                Title: "Payment Successful",
                Message: $"Your payment of {notification.Amount.Amount:N0} VND has been successfully processed.",
                DeepLink: NotificationRouteRegistry.Enrollment(notification.EnrollmentId)
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(EnrollmentActivatedEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.StudentUserId,
                Title: "Enrollment Activated",
                Message: "Your enrollment is now active. You can now schedule your sessions with the tutor.",
                DeepLink: NotificationRouteRegistry.Enrollment(notification.EnrollmentId)
            ),
            (
                UserId: notification.TutorUserId,
                Title: "New Student Enrollment",
                Message: "A student has completed enrollment. You can now coordinate session schedules.",
                DeepLink: NotificationRouteRegistry.Enrollment(notification.EnrollmentId)
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(EnrollmentCancelledEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.StudentUserId,
                Title: "Enrollment Cancelled",
                Message: $"Your enrollment #{notification.EnrollmentId} has been cancelled. Reason: {notification.Reason}",
                DeepLink: NotificationRouteRegistry.Enrollment(notification.EnrollmentId)
            ),
            (
                UserId: notification.TutorUserId,
                Title: "Enrollment Cancelled",
                Message: $"Enrollment #{notification.EnrollmentId} has been cancelled. Reason: {notification.Reason}",
                DeepLink: NotificationRouteRegistry.Enrollment(notification.EnrollmentId)
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(SessionScheduledEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.StudentUserId,
                Title: "Session Scheduled",
                Message: $"A session has been scheduled for {notification.StartAt:dd/MM/yyyy HH:mm} UTC.",
                DeepLink: NotificationRouteRegistry.Session(notification.SessionId)
            ),
            (
                UserId: notification.TutorUserId,
                Title: "Session Scheduled",
                Message: $"A session has been scheduled for {notification.StartAt:dd/MM/yyyy HH:mm} UTC.",
                DeepLink: NotificationRouteRegistry.Session(notification.SessionId)
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(SessionRescheduledEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.StudentUserId,
                Title: "Session Rescheduled",
                Message: $"A session has been rescheduled to {notification.NewStartAt:dd/MM/yyyy HH:mm} UTC.",
                DeepLink: NotificationRouteRegistry.Session(notification.SessionId)
            ),
            (
                UserId: notification.TutorUserId,
                Title: "Session Rescheduled",
                Message: $"A session has been rescheduled to {notification.NewStartAt:dd/MM/yyyy HH:mm} UTC.",
                DeepLink: NotificationRouteRegistry.Session(notification.SessionId)
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(SessionCancelledEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.StudentUserId,
                Title: "Session Cancelled",
                Message: $"Session has been cancelled. Reason: {notification.Reason}",
                DeepLink: NotificationRouteRegistry.Session(notification.SessionId)
            ),
            (
                UserId: notification.TutorUserId,
                Title: "Session Cancelled",
                Message: $"Session has been cancelled. Reason: {notification.Reason}",
                DeepLink: NotificationRouteRegistry.Session(notification.SessionId)
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(AttendanceVerificationRequiredEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.StudentUserId,
                Title: "Attendance Verification Required",
                Message: "Please verify your attendance for the completed session before the window closes.",
                DeepLink: NotificationRouteRegistry.Session(notification.SessionId)
            ),
            (
                UserId: notification.TutorUserId,
                Title: "Attendance Verification Required",
                Message: "Please verify your attendance for the completed session before the window closes.",
                DeepLink: NotificationRouteRegistry.Session(notification.SessionId)
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(AttendanceConflictDetectedEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.StudentUserId,
                Title: "Attendance Conflict Flagged",
                Message: $"Attendance conflict flagged (Student: {notification.StudentStatus}, Tutor: {notification.TutorStatus}). Please review or contact support.",
                DeepLink: NotificationRouteRegistry.Session(notification.SessionId)
            ),
            (
                UserId: notification.TutorUserId,
                Title: "Attendance Conflict Flagged",
                Message: $"Attendance conflict flagged (Student: {notification.StudentStatus}, Tutor: {notification.TutorStatus}). Please review or contact support.",
                DeepLink: NotificationRouteRegistry.Session(notification.SessionId)
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(SessionCompletedEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.StudentUserId,
                Title: "Session Completed",
                Message: "Session attendance was confirmed by both parties and the session is now marked completed.",
                DeepLink: NotificationRouteRegistry.Session(notification.SessionId)
            ),
            (
                UserId: notification.TutorUserId,
                Title: "Session Completed",
                Message: "Session attendance was confirmed by both parties and earnings have been credited.",
                DeepLink: NotificationRouteRegistry.Session(notification.SessionId)
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(EarningCreatedEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.TutorUserId,
                Title: "Session Earnings Released",
                Message: $"Earnings of {notification.NetPayout.Amount:N0} VND have been credited to your available balance.",
                DeepLink: NotificationRouteRegistry.WalletTransaction(notification.TransactionId)
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(WithdrawalRequestedEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.TutorUserId,
                Title: "Withdrawal Requested",
                Message: $"Your withdrawal request for {notification.Amount.Amount:N0} VND is pending administrator processing.",
                DeepLink: NotificationRouteRegistry.WalletWithdrawals()
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(WithdrawalCompletedEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.TutorUserId,
                Title: "Withdrawal Completed",
                Message: $"Your withdrawal request for {notification.Amount.Amount:N0} VND has been successfully processed to your bank account.",
                DeepLink: NotificationRouteRegistry.WalletWithdrawals()
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(WithdrawalFailedEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.TutorUserId,
                Title: "Withdrawal Failed",
                Message: $"Your withdrawal for {notification.Amount.Amount:N0} VND could not be processed. Funds have been returned to your available balance. Reason: {notification.Reason}",
                DeepLink: NotificationRouteRegistry.WalletWithdrawals()
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(RefundCreatedEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.StudentUserId,
                Title: "Refund Initiated",
                Message: $"A refund of {notification.Amount.Amount:N0} VND has been initiated for your enrollment.",
                DeepLink: NotificationRouteRegistry.Enrollment(notification.EnrollmentId)
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(RefundCompletedEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.StudentUserId,
                Title: "Refund Completed",
                Message: $"Your refund of {notification.Amount.Amount:N0} VND has been successfully completed.",
                DeepLink: NotificationRouteRegistry.Enrollment(notification.EnrollmentId)
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(ReviewCreatedEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.TutorUserId,
                Title: "New Student Review",
                Message: $"A student left a {notification.Rating}-star review on your profile.",
                DeepLink: NotificationRouteRegistry.TutorReviews()
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(DisputeCreatedEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.RaisedByUserId,
                Title: "Dispute Opened",
                Message: $"A dispute has been opened for enrollment #{notification.EnrollmentId}.",
                DeepLink: NotificationRouteRegistry.AdminDispute(notification.DisputeId)
            ),
            (
                UserId: notification.TargetUserId,
                Title: "Dispute Opened",
                Message: $"A dispute has been opened for enrollment #{notification.EnrollmentId}.",
                DeepLink: NotificationRouteRegistry.AdminDispute(notification.DisputeId)
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(DisputeResolvedEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.StudentUserId,
                Title: "Dispute Resolved",
                Message: $"The dispute has been resolved: {notification.Resolution}.",
                DeepLink: NotificationRouteRegistry.AdminDispute(notification.DisputeId)
            ),
            (
                UserId: notification.TutorUserId,
                Title: "Dispute Resolved",
                Message: $"The dispute has been resolved: {notification.Resolution}.",
                DeepLink: NotificationRouteRegistry.AdminDispute(notification.DisputeId)
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    public async Task Handle(ReportCreatedEvent notification, CancellationToken cancellationToken)
    {
        var recipients = new[]
        {
            (
                UserId: notification.TargetUserId,
                Title: "Trust & Safety Notification",
                Message: "A notice regarding your activity has been submitted for administrative review.",
                DeepLink: NotificationRouteRegistry.AdminReport(notification.ReportId)
            )
        };

        await ProcessNotificationIntentAsync(notification, recipients, cancellationToken);
    }

    private async Task ProcessNotificationIntentAsync(
        IBusinessEvent domainEvent,
        IEnumerable<(Guid UserId, string Title, string Message, string DeepLink)> recipients,
        CancellationToken cancellationToken)
    {
        const string consumerName = "NotificationConsumer";

        // 1. Idempotency Check (INV-EVENT-006, INV-EVENT-021)
        var alreadyProcessed = await _dbContext.InboxMessages
            .AnyAsync(i => i.ConsumerName == consumerName && i.EventId == domainEvent.EventId, cancellationToken);

        if (alreadyProcessed)
        {
            return;
        }

        var now = DateTime.UtcNow;
        var notificationsToInsert = new List<Notification>();
        var emailDeliveriesToInsert = new List<EmailDelivery>();

        var isCritical = NotificationDeliveryPolicy.IsCriticalNotification(domainEvent.EventType);
        var shouldSendEmail = NotificationDeliveryPolicy.ShouldSendEmail(domainEvent.EventType);

        var recipientList = recipients.ToList();
        var userIds = recipientList.Select(r => r.UserId).Distinct().ToList();

        var users = await _dbContext.Users
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, cancellationToken);

        foreach (var (userId, title, message, deepLink) in recipientList)
        {
            if (!users.TryGetValue(userId, out var user)) continue;

            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title,
                Message = message,
                Type = domainEvent.EventType,
                DeepLink = deepLink,
                IsCritical = isCritical,
                EventId = domainEvent.EventId,
                DeduplicationKey = $"event:{domainEvent.EventId}",
                CreatedAt = now
            };

            notificationsToInsert.Add(notification);

            if (shouldSendEmail && !string.IsNullOrWhiteSpace(user.Email))
            {
                var emailDelivery = new EmailDelivery
                {
                    Id = Guid.NewGuid(),
                    NotificationId = notification.Id,
                    Notification = notification,
                    UserId = userId,
                    ToEmail = user.Email,
                    Subject = title,
                    Body = message,
                    Status = EmailDeliveryStatus.Pending,
                    CreatedAt = now
                };

                emailDeliveriesToInsert.Add(emailDelivery);
            }
        }

        var inboxEntry = new InboxMessage
        {
            Id = Guid.NewGuid(),
            ConsumerName = consumerName,
            EventId = domainEvent.EventId,
            ProcessedAt = now
        };

        _dbContext.InboxMessages.Add(inboxEntry);
        _dbContext.Notifications.AddRange(notificationsToInsert);
        _dbContext.EmailDeliveries.AddRange(emailDeliveriesToInsert);

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            // Concurrent execution already handled this InboxMessage
            _logger.LogInformation("Concurrent duplicate delivery ignored for EventId {EventId}", domainEvent.EventId);
            return;
        }

        // Best-effort Realtime Push (INV-EVENT-016: SignalR failure never rolls back the committed state)
        foreach (var notif in notificationsToInsert)
        {
            try
            {
                var dto = new NotificationDto
                {
                    Id = notif.Id,
                    UserId = notif.UserId,
                    Title = notif.Title,
                    Message = notif.Message,
                    Type = notif.Type,
                    DeepLink = notif.DeepLink,
                    IsRead = notif.IsRead,
                    IsCritical = notif.IsCritical,
                    EventId = notif.EventId,
                    DeduplicationKey = notif.DeduplicationKey,
                    CreatedAt = notif.CreatedAt
                };

                if (_notificationService != null)
                {
                    await _notificationService.SendRealtimeNotificationAsync(notif.UserId, dto, cancellationToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Best-effort realtime push failed for user {UserId}", notif.UserId);
            }
        }
    }
}
