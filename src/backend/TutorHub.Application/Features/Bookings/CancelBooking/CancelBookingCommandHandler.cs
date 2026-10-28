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
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;

    public CancelBookingCommandHandler(IAppDbContext context, IClock clock, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _currentUserService = currentUserService;
    }

    public async Task<BookingDto> Handle(CancelBookingCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();
        var role = _currentUserService.Role;

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
        if (booking.StudentProfile.UserId == userId)
        {
            actor = CancelledBy.Student;
        }
        else if (booking.TutorProfile.UserId == userId)
        {
            actor = CancelledBy.Tutor;
        }
        else if (role == UserRole.Admin)
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

        var now = _clock.UtcNow;

        // 2. Validate cancellation eligibility via Domain entity
        if (!booking.CanCancel(actor))
        {
            throw new ConflictException($"Cannot cancel booking in '{booking.Status}' status.");
        }

        // 4. Update Booking via domain transition
        booking.Cancel(actor, request.Reason, now);

        // Preserve gateway attempts and their references. A delayed successful
        // callback must still find the attempt and create a refund.
        var paymentTx = await _context.GetPaymentTransactionAsync(booking.Id, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        // centralized mapping.
        return BookingMapper.ToDto(booking, BookingMapper.ToTransactionDto(paymentTx));
    }
}
