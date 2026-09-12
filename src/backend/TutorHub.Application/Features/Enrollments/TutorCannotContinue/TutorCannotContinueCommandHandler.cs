using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Enrollments.TutorCannotContinue;

public class TutorCannotContinueCommandHandler : IRequestHandler<TutorCannotContinueCommand, EnrollmentDto>
{
    private readonly IAppDbContext _context;

    public TutorCannotContinueCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<EnrollmentDto> Handle(TutorCannotContinueCommand request, CancellationToken cancellationToken)
    {
        var enrollment = await _context.Enrollments
            .Include(e => e.StudentProfile).ThenInclude(s => s.User)
            .Include(e => e.TutorProfile).ThenInclude(t => t.User)
            .Include(e => e.Subject)
            .Include(e => e.Service)
            .Include(e => e.Sessions)
            .FirstOrDefaultAsync(e => e.Id == request.EnrollmentId, cancellationToken);

        if (enrollment == null)
        {
            throw new NotFoundException("Enrollment", request.EnrollmentId);
        }

        // 1. Authorization: Only the Tutor of the Enrollment can declare Tutor Cannot Continue
        if (enrollment.TutorProfile.UserId != request.UserId)
        {
            throw new ForbiddenException("You do not have permission to declare inability to continue for this enrollment.");
        }

        // 2. State machine guard
        if (enrollment.Status == EnrollmentStatus.Completed)
        {
            throw new ConflictException("Cannot cancel an enrollment that is already completed.");
        }

        if (enrollment.Status == EnrollmentStatus.Cancelled)
        {
            throw new ConflictException("Enrollment is already cancelled.");
        }

        // 3. Domain Cancel with CancelledBy.Tutor
        var now = DateTime.UtcNow;
        var refundAmount = enrollment.Cancel(request.Reason, CancelledBy.Tutor);

        // 4. Financial Escrow Adjustment & Refund Record
        if (refundAmount > 0)
        {
            var wallet = await _context.Wallets.FirstOrDefaultAsync(
                w => w.TutorProfileId == enrollment.TutorProfileId,
                cancellationToken);

            if (wallet != null)
            {
                // Guarded domain debit preserves the pending-escrow invariant.
                wallet.DebitPending(refundAmount, now);
            }

            var refundTx = new Transaction
            {
                Id = Guid.NewGuid(),
                BookingId = enrollment.BookingId,
                SessionId = null,
                Amount = refundAmount,
                CommissionRate = 0,
                CommissionAmount = 0,
                PayoutAmount = 0,
                PaymentGatewayRef = $"EscrowRefund-{enrollment.Id:N}",
                Status = TransactionStatus.Refunded,
                CreatedAt = now,
                RefundedAt = now
            };
            _context.Transactions.Add(refundTx);
        }

        // 5. Explicit DB Transaction
        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }

        // F-23 (Đợt 4): centralized mapping.
        return EnrollmentMapper.ToDto(enrollment, enrollment.Subject.Name);
    }
}
