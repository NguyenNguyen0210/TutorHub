using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
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
    private readonly IClock _clock;

    public PayBookingCommandHandler(IAppDbContext context, IClock clock)
    {
        _context = context;
        _clock = clock;
    }

    public async Task<BookingDto> Handle(PayBookingCommand request, CancellationToken cancellationToken)
    {
        var booking = await _context.Bookings
            .Include(b => b.StudentProfile).ThenInclude(s => s.User)
            .Include(b => b.TutorProfile).ThenInclude(t => t.User)
            .Include(b => b.Subject)
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

        var now = _clock.UtcNow;

        // 2. State & Double-Payment Protection Validation
        if (booking.Status != BookingStatus.Holding)
        {
            throw new ConflictException($"Cannot pay for booking in '{booking.Status}' status.");
        }

        // 3. Holding Expiry Check (F-23: domain transition, not field sets).
        if (booking.HoldingExpiresAt.HasValue && now >= booking.HoldingExpiresAt.Value)
        {
            booking.Cancel(CancelledBy.System, "HoldingExpired", now);
            await _context.SaveChangesAsync(cancellationToken);

            throw new BadRequestException("The 15-minute holding period for this booking has expired. Please create a new booking.");
        }

        // 4. Atomic Execution: Service-based Booking vs Legacy Booking
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

    private async Task<BookingDto> ProcessPaymentInternalAsync(
        Booking booking,
        PayBookingCommand request,
        DateTime now,
        CancellationToken cancellationToken)
    {
        if (booking.ServiceId.HasValue)
        {
            // --- Service-based flow (Sprint 4) ---
            // Wave 3: Paid is the single canonical post-payment state.
            // Learning progress lives on Enrollment/Session from here on.
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
                // F-10: gateway refs must be unique per attempt (partial unique
                // index on PaymentGatewayRef) — suffix with the booking id.
                PaymentGatewayRef = $"{request.PaymentMethod ?? "Mock"}-{booking.Id:N}",
                CreatedAt = now
            };

            _context.Transactions.Add(paymentTx);

            // Invariant: Enrollment snapshots 100% FROM BOOKING + live PlatformFeeRate (DEC-S8-020)
            var feeRate = 0.10m;
            var feeVersion = 1;
            var feeSetting = await _context.PlatformSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Key == "PlatformFeeRate", cancellationToken);
            if (feeSetting != null && decimal.TryParse(feeSetting.Value, out var parsedRate) && parsedRate >= 0 && parsedRate < 1)
            {
                feeRate = parsedRate;
                feeVersion = feeSetting.CurrentVersion;
            }

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
                PlatformFeeRate = feeRate,
                FeePolicyVersion = feeVersion,
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
            // F-15: activate at the end of the paid flow, once escrow + sessions exist.
            enrollment.Activate();

            // Synchronize Tutor Wallet PendingBalance (Escrow hold)
            var wallet = await _context.Wallets
                .FirstOrDefaultAsync(w => w.TutorProfileId == booking.TutorProfileId, cancellationToken);

            if (wallet == null)
            {
                wallet = new Wallet
                {
                    Id = Guid.NewGuid(),
                    TutorProfileId = booking.TutorProfileId,
                    PendingBalance = 0,
                    AvailableBalance = 0,
                    UpdatedAt = now
                };
                _context.Wallets.Add(wallet);
            }

            // F-23: guarded domain math.
            wallet.CreditPending(booking.TotalPrice, now);

            // Enqueue Outbox Messages in same DB transaction (DEC-S7-001, DEC-S7-002)
            _context.AddOutboxMessage(new PaymentSucceededEvent(
                booking.Id,
                booking.StudentProfile.UserId,
                new MoneyDto(booking.TotalPrice),
                enrollment.Id));

            _context.AddOutboxMessage(new EnrollmentActivatedEvent(
                enrollment.Id,
                enrollment.StudentProfileId,
                enrollment.TutorProfileId,
                booking.StudentProfile.UserId,
                booking.TutorProfile.UserId));

            // F-23 (Đợt 4): centralized mapping.
            var enrollmentDto = EnrollmentMapper.ToDto(enrollment, booking.Subject.Name);

            return BookingMapper.ToDto(
                booking,
                BookingMapper.ToTransactionDto(paymentTx),
                enrollmentDto);
        }

        throw new InvalidOperationException("Booking is missing ServiceId commercial reference.");
    }
}
