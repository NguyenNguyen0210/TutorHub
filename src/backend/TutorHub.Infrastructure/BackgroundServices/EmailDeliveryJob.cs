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

    public EmailDeliveryJob(
        IServiceScopeFactory scopeFactory,
        ILogger<EmailDeliveryJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("EmailDeliveryJob started on worker {WorkerId}", _workerId);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var processedCount = await ProcessPendingEmailsBatchAsync(stoppingToken);
                if (processedCount == 0)
                {
                    await Task.Delay(3000, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in EmailDeliveryJob loop on worker {WorkerId}", _workerId);
                await Task.Delay(5000, stoppingToken);
            }
        }

        _logger.LogInformation("EmailDeliveryJob stopped on worker {WorkerId}", _workerId);
    }

    public async Task<int> ProcessPendingEmailsBatchAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var emailSender = scope.ServiceProvider.GetRequiredService<IEmailSender>();

        var now = DateTime.UtcNow;

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

            var claimed = await TryClaimLeaseAsync(dbContext, deliveryId, now, cancellationToken);
            if (!claimed) continue;

            var delivery = await dbContext.EmailDeliveries
                .FirstOrDefaultAsync(e => e.Id == deliveryId, cancellationToken);

            if (delivery == null) continue;

            await DispatchSingleEmailAsync(dbContext, emailSender, delivery, cancellationToken);
            processedCount++;
        }

        return processedCount;
    }

    private async Task<bool> TryClaimLeaseAsync(
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

        if (delivery == null) return false;

        delivery.Status = EmailDeliveryStatus.Processing;
        delivery.LockedUntil = leaseUntil;
        delivery.LockedBy = _workerId;

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
            _logger.LogWarning(ex, "Failed to claim lease for EmailDelivery {DeliveryId}", deliveryId);
            return false;
        }
    }

    private async Task DispatchSingleEmailAsync(
        IAppDbContext dbContext,
        IEmailSender emailSender,
        EmailDelivery delivery,
        CancellationToken cancellationToken)
    {
        try
        {
            var idempotencyKey = $"email:{delivery.Id}";
            await emailSender.SendEmailAsync(delivery.ToEmail, delivery.Subject, delivery.Body, idempotencyKey, cancellationToken);

            var now = DateTime.UtcNow;
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

            var now = DateTime.UtcNow;
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
