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
        var expiredIds = await _context.Bookings
            .Where(b => b.Status == BookingStatus.Holding &&
                        b.HoldingExpiresAt.HasValue &&
                        b.HoldingExpiresAt.Value <= now)
            .Select(b => b.Id)
            .ToListAsync(cancellationToken);

        foreach (var bookingId in expiredIds)
        {
            await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);
            var booking = await _context.Bookings
                .FromSqlInterpolated($"SELECT * FROM \"Bookings\" WHERE \"Id\" = {bookingId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);
            if (booking == null || booking.Status != BookingStatus.Holding ||
                !booking.HoldingExpiresAt.HasValue || booking.HoldingExpiresAt.Value > now)
            {
                await tx.CommitAsync(cancellationToken);
                continue;
            }

            // Keep payment attempts intact: a captured gateway payment may arrive late.
            booking.Expire(now);
            await _context.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
            processedCount++;
        }

        // Wave 3: the 24-hour tutor-confirmation expiry is gone with the
        // Confirm/Reject flow. Paid bookings never expire here; only the
        // 15-minute Holding window above is enforced.

        if (processedCount > 0)
            _logger.LogInformation("Successfully processed {Count} expired bookings.", processedCount);

        return processedCount;
    }
}
