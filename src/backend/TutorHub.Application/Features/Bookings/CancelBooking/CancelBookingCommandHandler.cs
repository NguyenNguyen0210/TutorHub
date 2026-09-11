using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Bookings.CancelBooking;

public class CancelBookingCommandHandler : IRequestHandler<CancelBookingCommand, BookingDto>
{
    private readonly IAppDbContext _context;

    public CancelBookingCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<BookingDto> Handle(CancelBookingCommand request, CancellationToken cancellationToken)
    {
        var booking = await _context.Bookings
            .Include(b => b.StudentProfile).ThenInclude(s => s.User)
            .Include(b => b.TutorProfile).ThenInclude(t => t.User)
            .Include(b => b.Subject)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);

        if (booking == null)
        {
            throw new NotFoundException("Booking", request.BookingId);
        }

        // 1. Determine actor based on ownership
        CancelledBy actor;
        if (booking.StudentProfile.UserId == request.UserId)
        {
            actor = CancelledBy.Student;
        }
        else if (booking.TutorProfile.UserId == request.UserId)
        {
            actor = CancelledBy.Tutor;
        }
        else if (request.Role == UserRole.Admin)
        {
            actor = CancelledBy.System;
        }
        else
        {
            throw new ForbiddenException("You do not have permission to cancel this booking.");
        }

        // A Paid booking is backed by an active Enrollment + escrow. Booking-level
        // cancellation would orphan it; route the user to enrollment cancellation.
        if (booking.Status == BookingStatus.Paid)
        {
            throw new ConflictException(
                "This booking has been paid and is backed by an active enrollment. " +
                "Cancel the enrollment instead so sessions, escrow and the pro-rata refund are handled consistently.");
        }

        var now = DateTime.UtcNow;

        // 2. Validate cancellation eligibility via Domain entity
        if (!booking.CanCancel(actor))
        {
            throw new ConflictException($"Cannot cancel booking in '{booking.Status}' status.");
        }

        // 4. Update Booking via domain transition
        booking.Cancel(actor, request.Reason, now);

        // A Holding booking never credited escrow (escrow is credited only on payment
        // success), so cancellation moves no money. Void any pre-allocated gateway
        // attempt so it cannot later be replayed as a valid payment.
        var paymentTx = await _context.GetPaymentTransactionAsync(booking.Id, cancellationToken);
        if (paymentTx != null && paymentTx.Status == TransactionStatus.Held)
        {
            paymentTx.Status = TransactionStatus.Failed;
            paymentTx.Description = "Booking cancelled before payment completed.";
        }

        await _context.SaveChangesAsync(cancellationToken);

        // F-23 (Đợt 4): centralized mapping.
        return BookingMapper.ToDto(booking, BookingMapper.ToTransactionDto(paymentTx));
    }
}
