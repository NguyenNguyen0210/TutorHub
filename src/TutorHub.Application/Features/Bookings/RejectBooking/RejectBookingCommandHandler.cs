using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Bookings.RejectBooking;

public class RejectBookingCommandHandler : IRequestHandler<RejectBookingCommand, BookingDto>
{
    private readonly IAppDbContext _context;

    public RejectBookingCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<BookingDto> Handle(RejectBookingCommand request, CancellationToken cancellationToken)
    {
        var booking = await _context.Bookings
            .Include(b => b.StudentProfile).ThenInclude(s => s.User)
            .Include(b => b.TutorProfile).ThenInclude(t => t.User)
            .Include(b => b.Subject)
            .Include(b => b.Transaction)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);

        if (booking == null)
        {
            throw new NotFoundException("Booking", request.BookingId);
        }

        // 1. Resource Ownership Check
        if (booking.TutorProfile.UserId != request.UserId)
        {
            throw new ForbiddenException("You do not have permission to reject this booking.");
        }

        // 2. Validate current status
        if (booking.Status != BookingStatus.Pending)
        {
            throw new ConflictException($"Cannot reject booking in '{booking.Status}' status.");
        }

        var now = DateTime.UtcNow;

        // 3. Reject Booking & 100% Refund
        booking.Status = BookingStatus.Cancelled;
        booking.CancelledBy = CancelledBy.Tutor;
        booking.CancellationReason = request.Reason;
        booking.CancelledAt = now;

        if (booking.Transaction != null)
        {
            booking.Transaction.Status = TransactionStatus.Refunded;
            booking.Transaction.RefundedAt = now;
        }

        await _context.SaveChangesAsync(cancellationToken);

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
            StartAt: booking.StartAt,
            EndAt: booking.EndAt,
            HourlyRate: booking.HourlyRate,
            TotalAmount: booking.TotalAmount,
            Status: booking.Status,
            HoldingExpiresAt: booking.HoldingExpiresAt,
            ConfirmedAt: booking.ConfirmedAt,
            CompletedAt: booking.CompletedAt,
            CancelledAt: booking.CancelledAt,
            CancelledBy: booking.CancelledBy,
            CancellationReason: booking.CancellationReason,
            CreatedAt: booking.CreatedAt,
            Transaction: booking.Transaction == null ? null : new TransactionDto(
                Id: booking.Transaction.Id,
                Amount: booking.Transaction.Amount,
                Status: booking.Transaction.Status,
                CommissionRate: booking.Transaction.CommissionRate,
                CommissionAmount: booking.Transaction.CommissionAmount,
                PayoutAmount: booking.Transaction.PayoutAmount,
                CreatedAt: booking.Transaction.CreatedAt,
                ReleasedAt: booking.Transaction.ReleasedAt,
                RefundedAt: booking.Transaction.RefundedAt
            )
        );
    }
}
