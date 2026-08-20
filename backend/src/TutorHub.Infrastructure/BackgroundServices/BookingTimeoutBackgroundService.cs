using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Features.Bookings.ProcessBookingTimeouts;

namespace TutorHub.Infrastructure.BackgroundServices;

public class BookingTimeoutBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BookingTimeoutBackgroundService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1);

    public BookingTimeoutBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<BookingTimeoutBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("BookingTimeoutBackgroundService has started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var sender = scope.ServiceProvider.GetRequiredService<ISender>();
                await sender.Send(new ProcessBookingTimeoutsCommand(), stoppingToken);
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "An error occurred while dispatching ProcessBookingTimeoutsCommand.");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("BookingTimeoutBackgroundService is stopping.");
    }
}
