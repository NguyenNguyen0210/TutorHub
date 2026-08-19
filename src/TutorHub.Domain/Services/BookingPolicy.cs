using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Services;

public static class BookingPolicy
{
    public static bool CanPay(Booking booking, DateTime now)
    {
        if (booking.Status != BookingStatus.Holding)
        {
            return false;
        }

        if (booking.HoldingExpiresAt.HasValue && now >= booking.HoldingExpiresAt.Value)
        {
            return false;
        }

        return true;
    }

    public static bool CanConfirm(Booking booking, DateTime now)
    {
        if (booking.Status != BookingStatus.Pending)
        {
            return false;
        }

        // Must be confirmed within 24 hours of creation/payment
        if (now > booking.CreatedAt.AddHours(24))
        {
            return false;
        }

        return true;
    }

    public static bool CanReject(Booking booking)
    {
        return booking.Status == BookingStatus.Pending;
    }

    public static bool CanCancel(Booking booking, CancelledBy actor)
    {
        if (booking.Status == BookingStatus.Completed || booking.Status == BookingStatus.Cancelled || booking.Status == BookingStatus.Expired)
        {
            return false;
        }

        if (actor == CancelledBy.Tutor)
        {
            return booking.Status == BookingStatus.Pending || booking.Status == BookingStatus.Confirmed;
        }

        if (actor == CancelledBy.Student)
        {
            return booking.Status == BookingStatus.Holding || booking.Status == BookingStatus.Pending || booking.Status == BookingStatus.Confirmed;
        }

        return true;
    }

    public static (decimal RefundPercentage, decimal RefundAmount, decimal PayoutAmount) CalculateRefund(
        CancelledBy actor,
        Booking booking,
        DateTime now)
    {
        if (booking.Status == BookingStatus.Holding)
        {
            return (0, 0, 0);
        }

        // If cancelled by Tutor or System: 100% refund
        if (actor == CancelledBy.Tutor || actor == CancelledBy.System)
        {
            return (100, booking.TotalAmount, 0);
        }

        // If cancelled by Student when still Pending: 100% refund
        if (booking.Status == BookingStatus.Pending)
        {
            return (100, booking.TotalAmount, 0);
        }

        // If cancelled by Student when Confirmed:
        // Before 24h of StartAt: 100% refund
        if (booking.StartAt - now >= TimeSpan.FromHours(24))
        {
            return (100, booking.TotalAmount, 0);
        }

        // Within 24h of StartAt: 50% refund, 50% paid to tutor
        var refundAmount = Math.Round(booking.TotalAmount * 0.5m, 2);
        var payoutAmount = booking.TotalAmount - refundAmount;

        return (50, refundAmount, payoutAmount);
    }

    public static bool CanComplete(Booking booking, DateTime now)
    {
        return booking.Status == BookingStatus.Confirmed && now >= booking.EndAt;
    }
}
