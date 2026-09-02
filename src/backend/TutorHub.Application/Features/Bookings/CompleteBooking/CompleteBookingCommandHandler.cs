using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.Services;

namespace TutorHub.Application.Features.Bookings.CompleteBooking;

public class CompleteBookingCommandHandler : IRequestHandler<CompleteBookingCommand, BookingDto>
{
    private readonly IAppDbContext _context;

    public CompleteBookingCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<BookingDto> Handle(CompleteBookingCommand request, CancellationToken cancellationToken)
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
        var isParticipantOrAdmin = (booking.StudentProfile.UserId == request.UserId) ||
                                   (booking.TutorProfile.UserId == request.UserId) ||
                                   (request.Role == UserRole.Admin);

        if (!isParticipantOrAdmin)
        {
            throw new ForbiddenException("You do not have permission to mark this booking as completed.");
        }

        var now = DateTime.UtcNow;

        // 2. Validate current status
        if (booking.Status != BookingStatus.Confirmed)
        {
            throw new ConflictException($"Cannot complete booking in '{booking.Status}' status. Booking must be Confirmed.");
        }

        // 4. Mark as Completed & Release Held Payment to Tutor
        booking.Status = BookingStatus.Completed;
        booking.CompletedAt = now;

        if (booking.Transaction != null && booking.Transaction.Status == TransactionStatus.Held)
        {
            booking.Transaction.Status = TransactionStatus.Released;
            booking.Transaction.ReleasedAt = now;

            // 5. Synchronize Tutor Wallet
            var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.TutorProfileId == booking.TutorProfileId, cancellationToken);
            if (wallet == null)
            {
                wallet = new Wallet
                {
                    Id = Guid.NewGuid(),
                    TutorProfileId = booking.TutorProfileId,
                    PendingBalance = 0,
                    AvailableBalance = booking.Transaction.PayoutAmount,
                    UpdatedAt = now
                };
                _context.Wallets.Add(wallet);
            }
            else
            {
                wallet.PendingBalance = Math.Max(0, wallet.PendingBalance - booking.TotalPrice);
                wallet.AvailableBalance += booking.Transaction.PayoutAmount;
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
