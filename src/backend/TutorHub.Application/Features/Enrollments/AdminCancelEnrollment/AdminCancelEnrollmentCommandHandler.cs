using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Enrollments.AdminCancelEnrollment;

public class AdminCancelEnrollmentCommandHandler : IRequestHandler<AdminCancelEnrollmentCommand, EnrollmentDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly IAuditLogService _auditLogService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IStudentWalletService _studentWalletService;

    public AdminCancelEnrollmentCommandHandler(
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

    public async Task<EnrollmentDto> Handle(AdminCancelEnrollmentCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();
        var role = _currentUserService.Role;

        // 1. Authorization: Only Admin can execute Administrative Emergency Cancellation
        if (role != UserRole.Admin)
        {
            throw new ForbiddenException("Only administrators have permission to perform administrative enrollment cancellation.");
        }

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

        // 2. Validate Enrollment State Machine
        if (enrollment.Status == EnrollmentStatus.Completed)
        {
            throw new ConflictException("Cannot cancel an enrollment that is already completed.");
        }

        if (enrollment.Status == EnrollmentStatus.Cancelled)
        {
            throw new ConflictException("Enrollment is already cancelled.");
        }

        // 3. Domain state transition and refund calculation (DEC-C7-REFUND-001)
        var now = _clock.UtcNow;
        var refundAmount = enrollment.Cancel(request.Reason, CancelledBy.Admin);

        // 4. Financial Escrow Adjustment & Refund Record (DEC-C7-FINANCE-003).
        // Lock the tutor wallet row so concurrent payouts/cancellations cannot
        // race the pending-escrow read-modify-write.
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
                    throw new InvalidOperationException("Financial invariant violated: Tutor wallet not found for escrow debit during admin cancellation.");
                }

                // Credit refund directly into Student Wallet (Holding -> Student Wallet)
                await _studentWalletService.CreditRefundAsync(
                    enrollment.StudentProfileId,
                    refundAmount,
                    "AdminEnrollmentCancellation",
                    enrollment.Id,
                    $"Admin hủy khóa học: {request.Reason.Trim()}",
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
                    description: $"Admin-cancelled enrollment refund: {request.Reason.Trim()}",
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

            await _auditLogService.LogAsync(
                action: "ENROLLMENT_ADMIN_CANCELLED",
                entityName: "Enrollment",
                entityId: enrollment.Id.ToString(),
                userId: userId,
                oldValues: new { status = "Active" },
                newValues: new { status = "Cancelled", reason = request.Reason, refundAmount },
                cancellationToken: cancellationToken);

            // Enqueue EnrollmentCancelled Outbox Message (DEC-S7-001, DEC-S7-002)
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
