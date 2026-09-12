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
    private readonly IAuditLogService _auditLogService;

    public AdminCancelEnrollmentCommandHandler(IAppDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    public async Task<EnrollmentDto> Handle(AdminCancelEnrollmentCommand request, CancellationToken cancellationToken)
    {
        // 1. Authorization: Only Admin can execute Administrative Emergency Cancellation
        if (request.Role != UserRole.Admin)
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

        // 2. State machine guard
        if (enrollment.Status == EnrollmentStatus.Completed)
        {
            throw new ConflictException("Cannot cancel an enrollment that is already completed.");
        }

        if (enrollment.Status == EnrollmentStatus.Cancelled)
        {
            throw new ConflictException("Enrollment is already cancelled.");
        }

        // 3. Domain Cancel with CancelledBy.Admin
        var now = DateTime.UtcNow;
        var refundAmount = enrollment.Cancel(request.Reason, CancelledBy.Admin);

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
                Type = TransactionType.StudentRefund,
                CommissionRate = 0,
                CommissionAmount = 0,
                PayoutAmount = 0,
                PaymentGatewayRef = $"EscrowRefund-{enrollment.Id:N}",
                Status = TransactionStatus.Refunded,
                Description = $"Admin-cancelled enrollment refund: {request.Reason.Trim()}",
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
            action: "ENROLLMENT_ADMIN_CANCELLED",
            entityName: "Enrollment",
            entityId: enrollment.Id.ToString(),
            userId: request.AdminUserId,
            oldValues: new { status = "Active" },
            newValues: new { status = "Cancelled", reason = request.Reason, refundAmount },
            cancellationToken: cancellationToken);

        // Enqueue EnrollmentCancelled Outbox Message (DEC-S7-001, DEC-S7-002)
        _context.AddOutboxMessage(new EnrollmentCancelledEvent(
            enrollment.Id,
            enrollment.StudentProfile.UserId,
            enrollment.TutorProfile.UserId,
            request.AdminUserId,
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
