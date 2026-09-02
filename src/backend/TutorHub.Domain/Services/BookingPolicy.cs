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
            return (100, booking.TotalPrice, 0);
        }

        // If cancelled by Student when still Pending: 100% refund
        if (booking.Status == BookingStatus.Pending)
        {
            return (100, booking.TotalPrice, 0);
        }

        // Default: 100% refund for unactivated bookings
        return (100, booking.TotalPrice, 0);
    }
}
