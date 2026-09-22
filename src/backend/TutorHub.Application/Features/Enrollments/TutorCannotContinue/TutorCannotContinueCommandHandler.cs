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
    private readonly IStudentWalletService _studentWalletService;

    public TutorCannotContinueCommandHandler(
        IAppDbContext context,
        IClock clock,
        IAuditLogService auditLogService,
        ICurrentUserService currentUserService,
        IStudentWalletService studentWalletService)
    {
        _context = context;
        _clock = clock;
        _auditLogService = auditLogService;
        _currentUserService = currentUserService;
        _studentWalletService = studentWalletService;
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

        // 1. Authorization: Only the assigned tutor can invoke this command (FR-CONTINUE-001)
        if (enrollment.TutorProfile.UserId != userId)
        {
            throw new ForbiddenException("Only the assigned tutor can report inability to continue.");
        }

        // 2. Status Validation: Only Active enrollments can be discontinued (FR-CONTINUE-001)
        if (enrollment.Status != EnrollmentStatus.Active)
        {
            throw new ConflictException($"Cannot discontinue an enrollment in '{enrollment.Status}' status. Only Active enrollments can be discontinued.");
        }

        // 3. Domain Logic: Cancel sessions and compute refund (INV-REFUND-001)
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

                // Credit refund directly into Student Wallet (Holding -> Student Wallet)
                await _studentWalletService.CreditRefundAsync(
                    enrollment.StudentProfileId,
                    refundAmount,
                    "TutorCannotContinueCancellation",
                    enrollment.Id,
                    $"Gia sư báo không thể tiếp tục: {request.Reason.Trim()}",
                    now,
                    cancellationToken);

                // Transaction ledger row for platform financial audit trail
                var refundTx = Transaction.CreateRefund(
                    bookingId: enrollment.BookingId,
                    sessionId: null,
                    disputeId: null,
                    originalPayout: null,
                    amount: refundAmount,
                    paymentGatewayRef: $"WalletRefund-{enrollment.Id:N}",
                    description: $"Tutor-cannot-continue enrollment refund: {request.Reason.Trim()}",
                    now: now);
                refundTx.Status = TransactionStatus.Succeeded;
                refundTx.RefundedAt = now;
                refundTx.SettlementRequired = false;
                _context.Transactions.Add(refundTx);

                // Enqueue RefundCreated and RefundCompleted Outbox Messages
                _context.AddOutboxMessage(new RefundCreatedEvent(
                    enrollment.Id,
                    enrollment.StudentProfile.UserId,
                    new MoneyDto(refundAmount),
                    refundTx.Id,
                    Guid.NewGuid(),
                    1,
                    now));

                _context.AddOutboxMessage(new RefundCompletedEvent(
                    enrollment.Id,
                    enrollment.StudentProfile.UserId,
                    new MoneyDto(refundAmount),
                    refundTx.Id,
                    Guid.NewGuid(),
                    1,
                    now));
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
