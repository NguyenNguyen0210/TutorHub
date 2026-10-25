using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Infrastructure.Distributed;

namespace TutorHub.Infrastructure.BackgroundServices;

public class IdempotencyCleanupJob : BackgroundService
{
    public const string LockKey = "cron:idempotency-cleanup";
    public static readonly TimeSpan LockTtl = TimeSpan.FromMinutes(10);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<IdempotencyCleanupJob> _logger;
    private readonly IRedisDistributedLock _distributedLock;
    private readonly string _workerId = Guid.NewGuid().ToString("N");
    private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1);

    public IdempotencyCleanupJob(
        IServiceScopeFactory scopeFactory,
        ILogger<IdempotencyCleanupJob> logger,
        IRedisDistributedLock distributedLock)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _distributedLock = distributedLock;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("IdempotencyCleanupJob has started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            var acquired = false;
            try
            {
                acquired = await _distributedLock.AcquireAsync(LockKey, _workerId, LockTtl, stoppingToken);
                if (!acquired)
                {
                    _logger.LogDebug("Skipping idempotency cleanup tick on worker {WorkerId}: lock {LockKey} held by another node.", _workerId, LockKey);
                }
                else
                {
                    using var scope = _scopeFactory.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
                    var clock = scope.ServiceProvider.GetRequiredService<IClock>();
                    var now = clock.UtcNow;

                    var deletedCount = await context.IdempotencyRecords
                        .Where(r => r.ExpiresAt <= now)
                        .ExecuteDeleteAsync(stoppingToken);

                    if (deletedCount > 0)
                    {
                        _logger.LogInformation("IdempotencyCleanupJob purged {Count} expired idempotency records.", deletedCount);
                    }
                }
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "An error occurred while cleaning up expired idempotency records.");
            }
            finally
            {
                if (acquired)
                {
                    try { await _distributedLock.ReleaseAsync(LockKey, _workerId, CancellationToken.None); }
                    catch (Exception ex) { _logger.LogWarning(ex, "Failed to release cron lock {LockKey}; it will expire via TTL.", LockKey); }
                }
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("IdempotencyCleanupJob is stopping.");
    }
}
