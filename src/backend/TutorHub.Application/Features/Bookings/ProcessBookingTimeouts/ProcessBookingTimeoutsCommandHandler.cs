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

    public ProcessBookingTimeoutsCommandHandler(
        IAppDbContext context,
        ILogger<ProcessBookingTimeoutsCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<int> Handle(ProcessBookingTimeoutsCommand request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
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

        // 2. Expire Pending Bookings (Past 24-hour tutor confirmation window)
        var expiredPendingBookings = await _context.Bookings
            .Include(b => b.Transaction)
            .Where(b => b.Status == BookingStatus.Pending &&
                        b.CreatedAt.AddHours(24) <= now)
            .ToListAsync(cancellationToken);

        if (expiredPendingBookings.Count > 0)
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

                    var wallet = await _context.Wallets
                        .FirstOrDefaultAsync(w => w.TutorProfileId == booking.TutorProfileId, cancellationToken);

                    if (wallet != null)
                    {
                        wallet.PendingBalance = Math.Max(0, wallet.PendingBalance - booking.TotalPrice);
                        wallet.UpdatedAt = now;
                    }
                }
            }
            processedCount += expiredPendingBookings.Count;
        }

        if (processedCount > 0)
        {
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Successfully processed {Count} expired bookings.", processedCount);
        }

        return processedCount;
    }
}
