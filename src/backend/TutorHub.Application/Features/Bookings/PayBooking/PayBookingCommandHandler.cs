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
            .Include(b => b.Enrollment).ThenInclude(e => e!.Sessions)
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

        // 2. State & Double-Payment Protection Validation
        if (booking.Status != BookingStatus.Holding)
        {
            throw new ConflictException($"Cannot pay for booking in '{booking.Status}' status.");
        }

        // 3. Holding Expiry Check
        if (booking.HoldingExpiresAt.HasValue && now >= booking.HoldingExpiresAt.Value)
        {
            booking.Status = BookingStatus.Cancelled;
            booking.CancelledBy = CancelledBy.System;
            booking.CancellationReason = "HoldingExpired";
            booking.CancelledAt = now;
            await _context.SaveChangesAsync(cancellationToken);

            throw new BadRequestException("The 15-minute holding period for this booking has expired. Please create a new booking.");
        }

        // 4. Atomic Execution: Service-based Booking vs Legacy Booking
        if (_context.Database?.ProviderName != null)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var result = await ProcessPaymentInternalAsync(booking, request, now, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return result;
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }
        else
        {
            var result = await ProcessPaymentInternalAsync(booking, request, now, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return result;
        }
    }

    private async Task<BookingDto> ProcessPaymentInternalAsync(
        Booking booking,
        PayBookingCommand request,
        DateTime now,
        CancellationToken cancellationToken)
    {
        if (booking.ServiceId.HasValue)
        {
            // --- Service-based flow (Sprint 4) ---
            booking.Status = BookingStatus.Paid;
            booking.HoldingExpiresAt = null;

            // Invariant: Initial Payment Transaction has SessionId = null (Held escrow)
            var paymentTx = new Transaction
            {
                Id = Guid.NewGuid(),
                BookingId = booking.Id,
                SessionId = null,
                Amount = booking.TotalPrice,
                Status = TransactionStatus.Held,
                CommissionRate = 0,
                CommissionAmount = 0,
                PayoutAmount = booking.TotalPrice,
                PaymentGatewayRef = request.PaymentMethod ?? "Mock",
                CreatedAt = now
            };

            _context.Transactions.Add(paymentTx);
            booking.Transaction = paymentTx;

            // Invariant: Enrollment snapshots 100% FROM BOOKING
            var enrollment = new Enrollment
            {
                Id = Guid.NewGuid(),
                BookingId = booking.Id,
                StudentProfileId = booking.StudentProfileId,
                TutorProfileId = booking.TutorProfileId,
                ServiceId = booking.ServiceId.Value,
                SubjectId = booking.SubjectId,
                TotalPrice = booking.TotalPrice,
                TotalSessions = booking.TotalSessions,
                SessionDurationMinutes = booking.SessionDurationMinutes,
                TeachingMode = booking.TeachingMode,
                CreatedAt = now
            };

            // Invariant: Generate N Unscheduled Sessions with immutable allocated earning amount
            var allocations = EnrollmentSessionAllocator.Allocate(booking.TotalPrice, booking.TotalSessions);
            for (var i = 0; i < booking.TotalSessions; i++)
            {
                enrollment.Sessions.Add(new Session
                {
                    Id = Guid.NewGuid(),
                    EnrollmentId = enrollment.Id,
                    SessionNumber = i + 1,
                    EarningAmount = allocations[i],
                    CreatedAt = now
                });
            }

            _context.Enrollments.Add(enrollment);
            booking.Enrollment = enrollment;

            // Synchronize Tutor Wallet PendingBalance (Escrow hold)
            var wallet = await _context.Wallets
                .FirstOrDefaultAsync(w => w.TutorProfileId == booking.TutorProfileId, cancellationToken);

            if (wallet == null)
            {
                wallet = new Wallet
                {
                    Id = Guid.NewGuid(),
                    TutorProfileId = booking.TutorProfileId,
                    PendingBalance = booking.TotalPrice,
                    AvailableBalance = 0,
                    UpdatedAt = now
                };
                _context.Wallets.Add(wallet);
            }
            else
            {
                wallet.PendingBalance += booking.TotalPrice;
                wallet.UpdatedAt = now;
            }

            var sessionDtos = enrollment.Sessions.OrderBy(s => s.SessionNumber).Select(s => new SessionDto(
                Id: s.Id,
                EnrollmentId: s.EnrollmentId,
                SessionNumber: s.SessionNumber,
                EarningAmount: s.EarningAmount,
                StartAt: s.StartAt,
                EndAt: s.EndAt,
                Status: s.Status,
                IsPayoutReleased: s.IsPayoutReleased,
                CreatedAt: s.CreatedAt,
                CompletedAt: s.CompletedAt,
                CancelledAt: s.CancelledAt
            )).ToList();

            var enrollmentDto = new EnrollmentDto(
                Id: enrollment.Id,
                BookingId: enrollment.BookingId,
                StudentProfileId: enrollment.StudentProfileId,
                TutorProfileId: enrollment.TutorProfileId,
                ServiceId: enrollment.ServiceId,
                SubjectId: enrollment.SubjectId,
                SubjectName: booking.Subject.Name,
                TotalPrice: enrollment.TotalPrice,
                TotalSessions: enrollment.TotalSessions,
                CompletedSessions: enrollment.CompletedSessions,
                SessionDurationMinutes: enrollment.SessionDurationMinutes,
                TeachingMode: enrollment.TeachingMode,
                Status: enrollment.Status,
                CreatedAt: enrollment.CreatedAt,
                CompletedAt: enrollment.CompletedAt,
                CancelledAt: enrollment.CancelledAt,
                CancelledBy: enrollment.CancelledBy,
                CancellationReason: enrollment.CancellationReason,
                Sessions: sessionDtos
            );

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
                Transaction: new TransactionDto(
                    Id: paymentTx.Id,
                    Amount: paymentTx.Amount,
                    Status: paymentTx.Status,
                    CommissionRate: paymentTx.CommissionRate,
                    CommissionAmount: paymentTx.CommissionAmount,
                    PayoutAmount: paymentTx.PayoutAmount,
                    CreatedAt: paymentTx.CreatedAt,
                    ReleasedAt: paymentTx.ReleasedAt,
                    RefundedAt: paymentTx.RefundedAt
                ),
                ServiceId: booking.ServiceId,
                TotalPrice: booking.TotalPrice,
                TotalSessions: booking.TotalSessions,
                SessionDurationMinutes: booking.SessionDurationMinutes,
                TeachingMode: booking.TeachingMode,
                Enrollment: enrollmentDto
            );
        }

        throw new InvalidOperationException("Booking is missing ServiceId commercial reference.");
    }
}
