using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.Bookings.DTOs;

/// <summary>
/// F-23 (Đợt 4): single mapping point for Booking → BookingDto/BookingSummaryDto.
/// The payment transaction and nested enrollment vary per use case, so they
/// are passed in explicitly (resolved via GetPaymentTransactionAsync).
/// </summary>
public static class BookingMapper
{
    public static BookingDto ToDto(
        Booking booking,
        TransactionDto? transaction,
        EnrollmentDto? enrollment = null)
    {
        return new BookingDto(
            Id: booking.Id,
            StudentProfileId: booking.StudentProfileId,
            StudentName: booking.StudentProfile.User.FullName,
            StudentEmail: booking.StudentProfile.User.Email,
            StudentPhone: booking.StudentProfile.User.Phone,
            TutorProfileId: booking.TutorProfileId,
            TutorName: booking.TutorProfile.User.FullName,
            TutorEmail: booking.TutorProfile.User.Email,
            TutorPhone: booking.TutorProfile.User.Phone,
            SubjectId: booking.SubjectId,
            SubjectName: booking.Subject.Name,
            Status: booking.Status,
            HoldingExpiresAt: booking.HoldingExpiresAt,
            ConfirmedAt: booking.ConfirmedAt,
            CompletedAt: booking.CompletedAt,
            CancelledAt: booking.CancelledAt,
            CancelledBy: booking.CancelledBy,
            CancellationReason: booking.CancellationReason,
            CreatedAt: booking.CreatedAt,
            Transaction: transaction,
            ServiceId: booking.ServiceId,
            TotalPrice: booking.TotalPrice,
            TotalSessions: booking.TotalSessions,
            SessionDurationMinutes: booking.SessionDurationMinutes,
            TeachingMode: booking.TeachingMode,
            Enrollment: enrollment
        );
    }

    public static TransactionDto? ToTransactionDto(Transaction? transaction)
    {
        if (transaction == null)
        {
            return null;
        }

        return new TransactionDto(
            Id: transaction.Id,
            Amount: transaction.Amount,
            Status: transaction.Status,
            CommissionRate: transaction.CommissionRate,
            CommissionAmount: transaction.CommissionAmount,
            PayoutAmount: transaction.PayoutAmount,
            CreatedAt: transaction.CreatedAt,
            ReleasedAt: transaction.ReleasedAt,
            RefundedAt: transaction.RefundedAt
        );
    }

    public static BookingSummaryDto ToSummaryDto(Booking booking)
    {
        return new BookingSummaryDto(
            Id: booking.Id,
            StudentProfileId: booking.StudentProfileId,
            StudentName: booking.StudentProfile.User.FullName,
            TutorProfileId: booking.TutorProfileId,
            TutorName: booking.TutorProfile.User.FullName,
            SubjectId: booking.SubjectId,
            SubjectName: booking.Subject.Name,
            ServiceId: booking.ServiceId,
            TotalPrice: booking.TotalPrice,
            TotalSessions: booking.TotalSessions,
            Status: booking.Status,
            CreatedAt: booking.CreatedAt
        );
    }
}
