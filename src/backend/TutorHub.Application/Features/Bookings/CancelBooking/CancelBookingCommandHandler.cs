using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
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

        var now = DateTime.UtcNow;

        // 2. Validate cancellation eligibility via Domain entity
        if (!booking.CanCancel(actor))
        {
            throw new ConflictException($"Cannot cancel booking in '{booking.Status}' status.");
        }

        // 3. Calculate refund via Domain entity
        var (refundPercentage, refundAmount, payoutAmount) = booking.CalculateRefund(actor);

        // 4. Update Booking via domain transition
        booking.Cancel(actor, request.Reason, now);

        // 5. Update Transaction & Tutor Wallet if payment was held
        var paymentTx = await _context.GetPaymentTransactionAsync(booking.Id, cancellationToken);

        if (paymentTx != null && paymentTx.Status == TransactionStatus.Held)
        {
            paymentTx.Status = TransactionStatus.Refunded;
            paymentTx.RefundedAt = now;
            paymentTx.PayoutAmount = payoutAmount;

            var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.TutorProfileId == booking.TutorProfileId, cancellationToken);
            if (wallet != null)
            {
                wallet.PendingBalance = Math.Max(0, wallet.PendingBalance - booking.TotalPrice);
                if (payoutAmount > 0)
                {
                    wallet.AvailableBalance += payoutAmount;
                }
                wallet.UpdatedAt = now;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        // F-23 (Đợt 4): centralized mapping.
        return BookingMapper.ToDto(booking, BookingMapper.ToTransactionDto(paymentTx));
    }
}
