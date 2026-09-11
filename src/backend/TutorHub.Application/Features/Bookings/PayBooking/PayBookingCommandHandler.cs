using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Bookings.PayBooking;

public class PayBookingCommandHandler : IRequestHandler<PayBookingCommand, BookingDto>
{
    private readonly IAppDbContext _context;
    private readonly IEnrollmentActivationService _activationService;
    private readonly IClock _clock;

    public PayBookingCommandHandler(
        IAppDbContext context,
        IEnrollmentActivationService activationService,
        IClock clock)
    {
        _context = context;
        _activationService = activationService;
        _clock = clock;
    }

    public async Task<BookingDto> Handle(PayBookingCommand request, CancellationToken cancellationToken)
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

        if (booking.StudentProfile.UserId != request.UserId)
        {
            throw new ForbiddenException("You do not have permission to pay for this booking.");
        }

        var now = _clock.UtcNow;

        if (booking.Status != BookingStatus.Holding)
        {
            throw new ConflictException($"Cannot pay for booking in '{booking.Status}' status.");
        }

        if (booking.HoldingExpiresAt.HasValue && now >= booking.HoldingExpiresAt.Value)
        {
            booking.Cancel(CancelledBy.System, "HoldingExpired", now);
            await _context.SaveChangesAsync(cancellationToken);

            throw new BadRequestException("The 15-minute holding period for this booking has expired. Please create a new booking.");
        }

        if (!booking.ServiceId.HasValue)
        {
            throw new InvalidOperationException("Booking is missing ServiceId commercial reference.");
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            booking.Status = BookingStatus.Paid;
            booking.HoldingExpiresAt = null;

            // The payment transaction represents the GROSS escrow amount.
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
                PaymentGatewayRef = $"{request.PaymentMethod ?? "Mock"}-{booking.Id:N}",
                CreatedAt = now
            };
            _context.Transactions.Add(paymentTx);

            var enrollment = await _activationService.ActivateAsync(booking, now, cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var enrollmentDto = EnrollmentMapper.ToDto(enrollment, booking.Subject.Name);

            return BookingMapper.ToDto(
                booking,
                BookingMapper.ToTransactionDto(paymentTx),
                enrollmentDto);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
