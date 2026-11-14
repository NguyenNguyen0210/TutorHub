using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Infrastructure.BackgroundServices;

public class EmailDeliveryJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmailDeliveryJob> _logger;
    private readonly string _workerId = Guid.NewGuid().ToString("N");

    public const int LeaseDurationSeconds = 60;
    public const int MaxRetries = 5;

    // Idle polling starts fast so a newly queued email is sent promptly, then backs off
    // exponentially. Without this the loop issued one query every 3 seconds (~29k queries/day)
    // even when the queue was empty, which dominated database egress.
    private static readonly TimeSpan MinIdleDelay = TimeSpan.FromSeconds(2);
    private static readonly TimeSpan MaxIdleDelay = TimeSpan.FromSeconds(30);

    private readonly IClock _clock;

    public EmailDeliveryJob(
        IServiceScopeFactory scopeFactory,
        ILogger<EmailDeliveryJob> logger,
        IClock clock)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _clock = clock;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("EmailDeliveryJob started on worker {WorkerId}", _workerId);

        var idleDelay = MinIdleDelay;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var processedCount = await ProcessPendingEmailsBatchAsync(stoppingToken);

                if (processedCount > 0)
                {
                    // Work was found: reset the backoff and pick up the next batch immediately.
                    idleDelay = MinIdleDelay;
                    continue;
                }

                await Task.Delay(idleDelay, stoppingToken);
                idleDelay = TimeSpan.FromMilliseconds(
                    Math.Min(idleDelay.TotalMilliseconds * 2, MaxIdleDelay.TotalMilliseconds));
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in EmailDeliveryJob loop on worker {WorkerId}", _workerId);
                await Task.Delay(MaxIdleDelay, stoppingToken);
            }
        }

        _logger.LogInformation("EmailDeliveryJob stopped on worker {WorkerId}", _workerId);
    }

    public async Task<int> ProcessPendingEmailsBatchAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IAppDbContext>();

        var now = _clock.UtcNow;

        var candidateIds = await dbContext.EmailDeliveries
            .Where(e => (e.Status == EmailDeliveryStatus.Pending ||
                        (e.Status == EmailDeliveryStatus.Processing && e.LockedUntil != null && e.LockedUntil < now)) &&
                        (e.NextAttemptAt == null || e.NextAttemptAt <= now))
            .OrderBy(e => e.CreatedAt)
            .Select(e => e.Id)
            .Take(20)
            .ToListAsync(cancellationToken);

        if (candidateIds.Count == 0)
        {
            return 0;
        }

        var processedCount = 0;

        foreach (var deliveryId in candidateIds)
        {
            if (cancellationToken.IsCancellationRequested) break;

            using var deliveryScope = _scopeFactory.CreateScope();
            var deliveryContext = deliveryScope.ServiceProvider.GetRequiredService<IAppDbContext>();
            var emailSender = deliveryScope.ServiceProvider.GetRequiredService<IEmailSender>();

            // The claim read already materialises the row, so it is reused for sending.
            // A second read here used to transfer the body (and every other column) twice.
            var delivery = await TryClaimLeaseAsync(deliveryContext, deliveryId, _clock.UtcNow, cancellationToken);
            if (delivery is null) continue;

            await DispatchSingleEmailAsync(deliveryContext, emailSender, delivery, cancellationToken);
            processedCount++;
        }

        return processedCount;
    }

    private async Task<EmailDelivery?> TryClaimLeaseAsync(
        IAppDbContext dbContext,
        Guid deliveryId,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var leaseUntil = now.AddSeconds(LeaseDurationSeconds);

        var delivery = await dbContext.EmailDeliveries
            .FirstOrDefaultAsync(e => e.Id == deliveryId &&
                (e.Status == EmailDeliveryStatus.Pending || (e.Status == EmailDeliveryStatus.Processing && e.LockedUntil < now)) &&
                (e.NextAttemptAt == null || e.NextAttemptAt <= now), cancellationToken);

        if (delivery == null) return null;

        delivery.Status = EmailDeliveryStatus.Processing;
        delivery.LockedUntil = leaseUntil;
        delivery.LockedBy = _workerId;

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return delivery;
        }
        catch (DbUpdateConcurrencyException)
        {
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to claim lease for EmailDelivery {DeliveryId}", deliveryId);
            return null;
        }
    }

    private async Task DispatchSingleEmailAsync(
        IAppDbContext dbContext,
        IEmailSender emailSender,
        EmailDelivery delivery,
        CancellationToken cancellationToken)
    {
        using var emailCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        emailCts.CancelAfter(TimeSpan.FromSeconds(30));

        try
        {
            var correlationId = $"email:{delivery.Id}";
            await emailSender.SendEmailAsync(delivery.ToEmail, delivery.Subject, delivery.Body, correlationId, emailCts.Token);

            var now = _clock.UtcNow;
            if (delivery.LockedBy == _workerId && delivery.Status == EmailDeliveryStatus.Processing)
            {
                delivery.Status = EmailDeliveryStatus.Sent;
                delivery.SentAt = now;
                delivery.LockedBy = null;
                delivery.LockedUntil = null;
                await dbContext.SaveChangesAsync(cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed sending email delivery {DeliveryId} to {ToEmail}", delivery.Id, delivery.ToEmail);

            var now = _clock.UtcNow;
            if (delivery.LockedBy == _workerId && delivery.Status == EmailDeliveryStatus.Processing)
            {
                delivery.RetryCount++;
                delivery.LastError = ex.Message.Length > 1000 ? ex.Message[..1000] : ex.Message;
                delivery.LockedBy = null;
                delivery.LockedUntil = null;

                if (delivery.RetryCount >= MaxRetries)
                {
                    delivery.Status = EmailDeliveryStatus.Failed;
                }
                else
                {
                    delivery.Status = EmailDeliveryStatus.Pending;
                    var delaySeconds = Math.Min((int)Math.Pow(2, delivery.RetryCount) * 2, 300);
                    delivery.NextAttemptAt = now.AddSeconds(delaySeconds);
                }

                await dbContext.SaveChangesAsync(cancellationToken);
            }
        }
    }
}
