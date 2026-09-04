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
            .Include(b => b.Transaction)
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
        if (booking.Transaction != null && booking.Transaction.Status == TransactionStatus.Held)
        {
            booking.Transaction.Status = TransactionStatus.Refunded;
            booking.Transaction.RefundedAt = now;
            booking.Transaction.PayoutAmount = payoutAmount;

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
            ),
            ServiceId: booking.ServiceId,
            TotalPrice: booking.TotalPrice,
            TotalSessions: booking.TotalSessions,
            SessionDurationMinutes: booking.SessionDurationMinutes,
            TeachingMode: booking.TeachingMode,
            Enrollment: null
        );
    }
}
