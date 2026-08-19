using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

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
                await ProcessTimeoutsAsync(stoppingToken);
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "An error occurred while processing booking timeouts.");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("BookingTimeoutBackgroundService is stopping.");
    }

    private async Task ProcessTimeoutsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var now = DateTime.UtcNow;

        // 1. Expire Holding Bookings (Past 15-minute window)
        var expiredHoldingBookings = await context.Bookings
            .Where(b => b.Status == BookingStatus.Holding &&
                        b.HoldingExpiresAt.HasValue &&
                        b.HoldingExpiresAt.Value <= now)
            .ToListAsync(cancellationToken);

        if (expiredHoldingBookings.Any())
        {
            _logger.LogInformation("Found {Count} expired holding bookings to release.", expiredHoldingBookings.Count);
            foreach (var booking in expiredHoldingBookings)
            {
                booking.Status = BookingStatus.Cancelled;
                booking.CancelledBy = CancelledBy.System;
                booking.CancellationReason = "HoldingExpired";
                booking.CancelledAt = now;
            }
        }

        // 2. Expire Pending Bookings (Past 24-hour tutor confirmation window)
        var expiredPendingBookings = await context.Bookings
            .Include(b => b.Transaction)
            .Where(b => b.Status == BookingStatus.Pending &&
                        b.CreatedAt.AddHours(24) <= now)
            .ToListAsync(cancellationToken);

        if (expiredPendingBookings.Any())
        {
            _logger.LogInformation("Found {Count} expired pending bookings to refund and cancel.", expiredPendingBookings.Count);
            foreach (var booking in expiredPendingBookings)
            {
                booking.Status = BookingStatus.Cancelled;
                booking.CancelledBy = CancelledBy.System;
                booking.CancellationReason = "TutorConfirmationTimeout";
                booking.CancelledAt = now;

                if (booking.Transaction != null && booking.Transaction.Status == TransactionStatus.Held)
                {
                    booking.Transaction.Status = TransactionStatus.Refunded;
                    booking.Transaction.RefundedAt = now;

                    var wallet = await context.Wallets.FirstOrDefaultAsync(w => w.TutorProfileId == booking.TutorProfileId, cancellationToken);
                    if (wallet != null)
                    {
                        wallet.PendingBalance = Math.Max(0, wallet.PendingBalance - booking.TotalAmount);
                        wallet.UpdatedAt = now;
                    }
                }
            }
        }

        if (expiredHoldingBookings.Any() || expiredPendingBookings.Any())
        {
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
