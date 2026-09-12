using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Enrollments.CancelEnrollment;

public class CancelEnrollmentCommandHandler : IRequestHandler<CancelEnrollmentCommand, EnrollmentDto>
{
    private readonly IAppDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public CancelEnrollmentCommandHandler(IAppDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    public async Task<EnrollmentDto> Handle(CancelEnrollmentCommand request, CancellationToken cancellationToken)
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

        // 1. Authorization: Only the Student of the Enrollment can execute Student Cancellation
        if (enrollment.StudentProfile.UserId != request.UserId)
        {
            throw new ForbiddenException("You do not have permission to cancel this enrollment.");
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
        var now = DateTime.UtcNow;
        var refundAmount = enrollment.Cancel(request.Reason, CancelledBy.Student);

        // 4. Financial Escrow Adjustment & Refund Record (DEC-C7-FINANCE-003)
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
                Type = TransactionType.StudentRefund,
                CommissionRate = 0,
                CommissionAmount = 0,
                PayoutAmount = 0,
                PaymentGatewayRef = $"EscrowRefund-{enrollment.Id:N}",
                Status = TransactionStatus.Refunded,
                Description = $"Student-cancelled enrollment refund: {request.Reason.Trim()}",
                CreatedAt = now,
                RefundedAt = now
            };
            _context.Transactions.Add(refundTx);

            // Enqueue RefundCreated Outbox Message (DEC-S7-001, DEC-S7-002)
            _context.AddOutboxMessage(new RefundCreatedEvent(
                enrollment.Id,
                enrollment.StudentProfile.UserId,
                new MoneyDto(refundAmount),
                refundTx.Id));
        }

        await _auditLogService.LogAsync(
            action: "ENROLLMENT_CANCELLED",
            entityName: "Enrollment",
            entityId: enrollment.Id.ToString(),
            userId: request.UserId,
            oldValues: new { status = "Active" },
            newValues: new { status = "Cancelled", reason = request.Reason, refundAmount },
            cancellationToken: cancellationToken);

        // Enqueue EnrollmentCancelled Outbox Message (DEC-S7-001, DEC-S7-002)
        _context.AddOutboxMessage(new EnrollmentCancelledEvent(
            enrollment.Id,
            enrollment.StudentProfile.UserId,
            enrollment.TutorProfile.UserId,
            request.UserId,
            request.Reason));

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
