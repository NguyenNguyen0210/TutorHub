using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Enrollments.TutorCannotContinue;

public class TutorCannotContinueCommandHandler : IRequestHandler<TutorCannotContinueCommand, EnrollmentDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly IAuditLogService _auditLogService;
    private readonly ICurrentUserService _currentUserService;

    public TutorCannotContinueCommandHandler(IAppDbContext context, IClock clock, IAuditLogService auditLogService, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _auditLogService = auditLogService;
        _currentUserService = currentUserService;
    }

    public async Task<EnrollmentDto> Handle(TutorCannotContinueCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

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
        if (enrollment.TutorProfile.UserId != userId)
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
        var now = _clock.UtcNow;
        var refundAmount = enrollment.Cancel(request.Reason, CancelledBy.Tutor);

        // 4. Financial Escrow Adjustment & Refund Record. Lock the tutor wallet
        // row so concurrent payouts/cancellations cannot race the escrow debit.
        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            if (refundAmount > 0)
            {
                var wallet = await _context.Wallets
                    .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"TutorProfileId\" = {enrollment.TutorProfileId} FOR UPDATE")
                    .FirstOrDefaultAsync(cancellationToken);

                if (wallet != null)
                {
                    // Guarded domain debit preserves the pending-escrow invariant.
                    wallet.DebitPending(refundAmount, now);
                }
                else
                {
                    throw new InvalidOperationException("Financial invariant violated: Tutor wallet not found for escrow debit during tutor cancellation.");
                }

                // DEC-S8-032 / INV-REFUND-004: refunds start Pending and only settle
                // via the external provider callback; the obligation is explicit.
                var refundTx = Transaction.CreateRefund(
                    bookingId: enrollment.BookingId,
                    sessionId: null,
                    disputeId: null,
                    originalPayout: null,
                    amount: refundAmount,
                    paymentGatewayRef: $"EscrowRefund-{enrollment.Id:N}",
                    description: $"Tutor-cannot-continue enrollment refund: {request.Reason.Trim()}",
                    now: now);
                refundTx.SettlementRequired = true;
                _context.Transactions.Add(refundTx);

                // Enqueue RefundCreated Outbox Message (DEC-S7-001, DEC-S7-002)
                _context.AddOutboxMessage(new RefundCreatedEvent(
                    enrollment.Id,
                    enrollment.StudentProfile.UserId,
                    new MoneyDto(refundAmount),
                    refundTx.Id));
            }

            // 5. Audit + notify affected parties (FR-CONTINUE-003, PRD §8.2)
            await _auditLogService.LogAsync(
                action: "ENROLLMENT_TUTOR_CANNOT_CONTINUE",
                entityName: "Enrollment",
                entityId: enrollment.Id.ToString(),
                userId: userId,
                oldValues: new { status = "Active" },
                newValues: new { status = "Cancelled", reason = request.Reason, refundAmount },
                cancellationToken: cancellationToken);

            _context.AddOutboxMessage(new EnrollmentCancelledEvent(
                enrollment.Id,
                enrollment.StudentProfile.UserId,
                enrollment.TutorProfile.UserId,
                userId,
                request.Reason));

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
