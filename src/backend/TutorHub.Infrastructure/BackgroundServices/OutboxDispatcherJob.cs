using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Infrastructure.BackgroundServices;

public class OutboxDispatcherJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OutboxDispatcherJob> _logger;
    private readonly string _workerId = Guid.NewGuid().ToString("N");

    public const int LeaseDurationSeconds = 60;
    public const int HandlerTimeoutSeconds = 45;
    public const int MaxRetries = 5;

    private static readonly Dictionary<string, Type> EventTypeRegistry = new()
    {
        // 1. Marketplace
        [BusinessEventTypes.TutorApplicationSubmitted] = typeof(TutorApplicationSubmittedEvent),
        [BusinessEventTypes.TutorApplicationApproved] = typeof(TutorApplicationApprovedEvent),
        [BusinessEventTypes.TutorApplicationRejected] = typeof(TutorApplicationRejectedEvent),

        // 2. Enrollment & Agreements
        [BusinessEventTypes.CustomOfferCreated] = typeof(CustomOfferCreatedEvent),
        [BusinessEventTypes.CustomOfferAccepted] = typeof(CustomOfferAcceptedEvent),
        [BusinessEventTypes.PaymentSucceeded] = typeof(PaymentSucceededEvent),
        [BusinessEventTypes.EnrollmentActivated] = typeof(EnrollmentActivatedEvent),
        [BusinessEventTypes.EnrollmentCancelled] = typeof(EnrollmentCancelledEvent),

        // 3. Sessions & Attendance
        [BusinessEventTypes.SessionScheduled] = typeof(SessionScheduledEvent),
        [BusinessEventTypes.SessionRescheduled] = typeof(SessionRescheduledEvent),
        [BusinessEventTypes.SessionCancelled] = typeof(SessionCancelledEvent),
        [BusinessEventTypes.AttendanceVerificationRequired] = typeof(AttendanceVerificationRequiredEvent),
        [BusinessEventTypes.AttendanceConflictDetected] = typeof(AttendanceConflictDetectedEvent),
        [BusinessEventTypes.SessionCompleted] = typeof(SessionCompletedEvent),

        // 4. Financial & Payouts
        [BusinessEventTypes.EarningCreated] = typeof(EarningCreatedEvent),
        [BusinessEventTypes.RefundCreated] = typeof(RefundCreatedEvent),
        [BusinessEventTypes.RefundCompleted] = typeof(RefundCompletedEvent),
        [BusinessEventTypes.WithdrawalRequested] = typeof(WithdrawalRequestedEvent),
        [BusinessEventTypes.WithdrawalCompleted] = typeof(WithdrawalCompletedEvent),
        [BusinessEventTypes.WithdrawalFailed] = typeof(WithdrawalFailedEvent),

        // 5. Trust, Safety & Disputes
        [BusinessEventTypes.ReviewCreated] = typeof(ReviewCreatedEvent),
        [BusinessEventTypes.DisputeCreated] = typeof(DisputeCreatedEvent),
        [BusinessEventTypes.DisputeResolved] = typeof(DisputeResolvedEvent),
        [BusinessEventTypes.ReportCreated] = typeof(ReportCreatedEvent),

        // Communication
        [BusinessEventTypes.MessageSent] = typeof(MessageSentEvent)
    };

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public OutboxDispatcherJob(
        IServiceScopeFactory scopeFactory,
        ILogger<OutboxDispatcherJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OutboxDispatcherJob started on worker {WorkerId}", _workerId);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var processedCount = await ProcessPendingMessagesBatchAsync(stoppingToken);
                if (processedCount == 0)
                {
                    await Task.Delay(2000, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in OutboxDispatcherJob loop on worker {WorkerId}", _workerId);
                await Task.Delay(5000, stoppingToken);
            }
        }

        _logger.LogInformation("OutboxDispatcherJob stopped on worker {WorkerId}", _workerId);
    }

    public async Task<int> ProcessPendingMessagesBatchAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var publisher = scope.ServiceProvider.GetRequiredService<IPublisher>();

        var now = DateTime.UtcNow;

        // 1. Query pending messages eligible for lease
        var candidateIds = await dbContext.OutboxMessages
            .Where(m => (m.Status == OutboxMessageStatus.Pending || 
                        (m.Status == OutboxMessageStatus.Processing && m.LockedUntil != null && m.LockedUntil < now)) &&
                        (m.NextAttemptAt == null || m.NextAttemptAt <= now))
            .OrderBy(m => m.CreatedAt)
            .Select(m => m.Id)
            .Take(20)
            .ToListAsync(cancellationToken);

        if (candidateIds.Count == 0)
        {
            return 0;
        }

        var processedCount = 0;

        foreach (var messageId in candidateIds)
        {
            if (cancellationToken.IsCancellationRequested) break;

            var claimed = await TryClaimLeaseAsync(dbContext, messageId, now, cancellationToken);
            if (!claimed)
            {
                continue; // Another worker claimed this message
            }

            var message = await dbContext.OutboxMessages
                .FirstOrDefaultAsync(m => m.Id == messageId, cancellationToken);

            if (message == null) continue;

            await DispatchSingleMessageAsync(dbContext, publisher, message, cancellationToken);
            processedCount++;
        }

        return processedCount;
    }

    private async Task<bool> TryClaimLeaseAsync(
        IAppDbContext dbContext,
        Guid messageId,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var leaseUntil = now.AddSeconds(LeaseDurationSeconds);

        var message = await dbContext.OutboxMessages
            .FirstOrDefaultAsync(m => m.Id == messageId &&
                (m.Status == OutboxMessageStatus.Pending || (m.Status == OutboxMessageStatus.Processing && m.LockedUntil < now)) &&
                (m.NextAttemptAt == null || m.NextAttemptAt <= now), cancellationToken);

        if (message == null) return false;

        message.Status = OutboxMessageStatus.Processing;
        message.LockedUntil = leaseUntil;
        message.LockedBy = _workerId;

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateConcurrencyException)
        {
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to claim lease for OutboxMessage {MessageId}", messageId);
            return false;
        }
    }

    private async Task DispatchSingleMessageAsync(
        IAppDbContext dbContext,
        IPublisher publisher,
        OutboxMessage message,
        CancellationToken stoppingToken)
    {
        using var handlerCts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
        handlerCts.CancelAfter(TimeSpan.FromSeconds(HandlerTimeoutSeconds));

        try
        {
            if (!EventTypeRegistry.TryGetValue(message.EventType, out var eventType))
            {
                throw new InvalidOperationException($"Unknown or unregistered event type '{message.EventType}'.");
            }

            var eventObj = JsonSerializer.Deserialize(message.Payload, eventType, JsonOptions);
            if (eventObj == null)
            {
                throw new InvalidOperationException($"Failed to deserialize payload for event type '{message.EventType}'.");
            }

            // In-process dispatch to MediatR handlers (INV-EVENT-002)
            await publisher.Publish(eventObj, handlerCts.Token);

            // Mark completed safely with token check (INV-EVENT-011, INV-EVENT-012)
            var completeNow = DateTime.UtcNow;
            if (message.LockedBy == _workerId && message.Status == OutboxMessageStatus.Processing)
            {
                message.Status = OutboxMessageStatus.Processed;
                message.ProcessedAt = completeNow;
                message.LockedBy = null;
                message.LockedUntil = null;
                await dbContext.SaveChangesAsync(stoppingToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed dispatching OutboxMessage {EventId} of type {EventType}", message.EventId, message.EventType);

            var failNow = DateTime.UtcNow;
            if (message.LockedBy == _workerId && message.Status == OutboxMessageStatus.Processing)
            {
                message.RetryCount++;
                message.LastError = ex.Message.Length > 1000 ? ex.Message[..1000] : ex.Message;
                message.LockedBy = null;
                message.LockedUntil = null;

                if (message.RetryCount >= MaxRetries)
                {
                    message.Status = OutboxMessageStatus.DeadLettered;
                    message.DeadLetteredAt = failNow;
                    _logger.LogError("OutboxMessage {EventId} reached max retries ({MaxRetries}) and was moved to DeadLettered state", message.EventId, MaxRetries);
                }
                else
                {
                    message.Status = OutboxMessageStatus.Pending;
                    var delaySeconds = Math.Min((int)Math.Pow(2, message.RetryCount), 300);
                    message.NextAttemptAt = failNow.AddSeconds(delaySeconds);
                }

                await dbContext.SaveChangesAsync(stoppingToken);
            }
        }
    }
}
