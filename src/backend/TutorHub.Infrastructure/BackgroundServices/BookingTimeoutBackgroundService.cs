using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Features.Bookings.ProcessBookingTimeouts;
using TutorHub.Infrastructure.Distributed;

namespace TutorHub.Infrastructure.BackgroundServices;

public class BookingTimeoutBackgroundService : BackgroundService
{
    public const string LockKey = "cron:booking-timeout";
    public static readonly TimeSpan LockTtl = TimeSpan.FromSeconds(50);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BookingTimeoutBackgroundService> _logger;
    private readonly IRedisDistributedLock _distributedLock;
    private readonly string _workerId = Guid.NewGuid().ToString("N");
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1);

    public BookingTimeoutBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<BookingTimeoutBackgroundService> logger,
        IRedisDistributedLock distributedLock)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _distributedLock = distributedLock;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("BookingTimeoutBackgroundService has started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            var acquired = false;
            try
            {
                acquired = await _distributedLock.AcquireAsync(LockKey, _workerId, LockTtl, stoppingToken);
                if (!acquired)
                {
                    _logger.LogDebug("Skipping booking-timeout tick on worker {WorkerId}: lock {LockKey} held by another node.", _workerId, LockKey);
                }
                else
                {
                    using var scope = _scopeFactory.CreateScope();
                    var sender = scope.ServiceProvider.GetRequiredService<ISender>();
                    await sender.Send(new ProcessBookingTimeoutsCommand(), stoppingToken);
                }
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "An error occurred while dispatching ProcessBookingTimeoutsCommand.");
            }
            finally
            {
                if (acquired)
                {
                    await _distributedLock.ReleaseAsync(LockKey, _workerId, CancellationToken.None);
                }
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("BookingTimeoutBackgroundService is stopping.");
    }
}
