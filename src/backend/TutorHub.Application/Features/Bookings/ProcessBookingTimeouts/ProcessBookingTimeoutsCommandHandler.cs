using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Bookings.ProcessBookingTimeouts;

public class ProcessBookingTimeoutsCommandHandler : IRequestHandler<ProcessBookingTimeoutsCommand, int>
{
    private readonly IAppDbContext _context;
    private readonly ILogger<ProcessBookingTimeoutsCommandHandler> _logger;
    private readonly IClock _clock;

    public ProcessBookingTimeoutsCommandHandler(
        IAppDbContext context,
        ILogger<ProcessBookingTimeoutsCommandHandler> logger,
        IClock clock)
    {
        _context = context;
        _logger = logger;
        _clock = clock;
    }

    public async Task<int> Handle(ProcessBookingTimeoutsCommand request, CancellationToken cancellationToken)
    {
        var now = _clock.UtcNow;
        var processedCount = 0;

        // 1. Expire Holding Bookings (Past 15-minute window)
        var expiredHoldingBookings = await _context.Bookings
            .Where(b => b.Status == BookingStatus.Holding &&
                        b.HoldingExpiresAt.HasValue &&
                        b.HoldingExpiresAt.Value <= now)
            .ToListAsync(cancellationToken);

        if (expiredHoldingBookings.Count > 0)
        {
            _logger.LogInformation("Found {Count} expired holding bookings to release.", expiredHoldingBookings.Count);
            foreach (var booking in expiredHoldingBookings)
            {
                booking.Status = BookingStatus.Cancelled;
                booking.CancelledBy = CancelledBy.System;
                booking.CancellationReason = "HoldingExpired";
                booking.CancelledAt = now;
            }
            processedCount += expiredHoldingBookings.Count;
        }

        // Wave 3: the 24-hour tutor-confirmation expiry is gone with the
        // Confirm/Reject flow. Paid bookings never expire here; only the
        // 15-minute Holding window above is enforced.

        if (processedCount > 0)
        {
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Successfully processed {Count} expired bookings.", processedCount);
        }

        return processedCount;
    }
}
