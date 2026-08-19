using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.Services;

namespace TutorHub.Application.Features.Bookings.PayBooking;

public class PayBookingCommandHandler : IRequestHandler<PayBookingCommand, BookingDto>
{
    private readonly IAppDbContext _context;

    public PayBookingCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<BookingDto> Handle(PayBookingCommand request, CancellationToken cancellationToken)
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
        if (booking.StudentProfile.UserId != request.UserId)
        {
            throw new ForbiddenException("You do not have permission to pay for this booking.");
        }

        var now = DateTime.UtcNow;

        // 2. State & Expiration Validation
        if (booking.Status != BookingStatus.Holding)
        {
            throw new ConflictException($"Cannot pay for booking in '{booking.Status}' status.");
        }

        if (booking.HoldingExpiresAt.HasValue && now >= booking.HoldingExpiresAt.Value)
        {
            // Lazy expiration handling
            booking.Status = BookingStatus.Cancelled;
            booking.CancelledBy = CancelledBy.System;
            booking.CancellationReason = "HoldingExpired";
            booking.CancelledAt = now;
            await _context.SaveChangesAsync(cancellationToken);

            throw new BadRequestException("The 15-minute holding period for this booking has expired. Please create a new booking.");
        }

        // 3. Transition to Pending & Create Held Transaction
        booking.Status = BookingStatus.Pending;
        booking.HoldingExpiresAt = null;

        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            Amount = booking.TotalAmount,
            Status = TransactionStatus.Held,
            CommissionRate = 0,
            CommissionAmount = 0,
            PayoutAmount = booking.TotalAmount,
            PaymentGatewayRef = request.PaymentMethod ?? "Mock",
            CreatedAt = now
        };

        _context.Transactions.Add(transaction);
        booking.Transaction = transaction;

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
            Transaction: new TransactionDto(
                Id: transaction.Id,
                Amount: transaction.Amount,
                Status: transaction.Status,
                CommissionRate: transaction.CommissionRate,
                CommissionAmount: transaction.CommissionAmount,
                PayoutAmount: transaction.PayoutAmount,
                CreatedAt: transaction.CreatedAt,
                ReleasedAt: transaction.ReleasedAt,
                RefundedAt: transaction.RefundedAt
            )
        );
    }
}
