using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Bookings;

/// <summary>
/// P0 HOTFIX helper: a booking owns many transactions (payment + payouts +
/// refunds), so the single "payment transaction" is resolved explicitly by
/// (BookingId, BookingPayment) instead of a 1:1 navigation.
/// </summary>
public static class BookingPaymentTransactionExtensions
{
    public static Task<Transaction?> GetPaymentTransactionAsync(
        this IAppDbContext context,
        Guid bookingId,
        CancellationToken cancellationToken)
    {
        return context.Transactions.FirstOrDefaultAsync(
            t => t.BookingId == bookingId && t.Type == TransactionType.BookingPayment,
            cancellationToken);
    }
}
