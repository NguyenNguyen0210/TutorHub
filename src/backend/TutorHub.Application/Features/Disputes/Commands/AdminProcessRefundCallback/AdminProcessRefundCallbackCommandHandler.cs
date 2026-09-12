using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Disputes.Commands.AdminProcessRefundCallback;

public class AdminProcessRefundCallbackCommandHandler : IRequestHandler<AdminProcessRefundCallbackCommand, RefundCallbackResultDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly IAuditLogService _auditLogService;

    public AdminProcessRefundCallbackCommandHandler(IAppDbContext context, IClock clock, IAuditLogService auditLogService)
    {
        _context = context;
        _clock = clock;
        _auditLogService = auditLogService;
    }

    public async Task<RefundCallbackResultDto> Handle(AdminProcessRefundCallbackCommand request, CancellationToken cancellationToken)
    {
        var refundTx = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == request.RefundTransactionId, cancellationToken);

        if (refundTx == null)
        {
            throw new NotFoundException(nameof(Transaction), request.RefundTransactionId);
        }

        if (refundTx.Type != TransactionType.StudentRefund)
        {
            throw new BadRequestException("Transaction is not a StudentRefund.");
        }

        if (refundTx.Status == TransactionStatus.Succeeded)
        {
            throw new ConflictException("Refund has already settled successfully.");
        }

        var now = _clock.UtcNow;
        var oldStatus = refundTx.Status;

        Dispute? dispute = null;
        if (refundTx.DisputeId.HasValue)
        {
            dispute = await _context.Disputes
                .FirstOrDefaultAsync(d => d.Id == refundTx.DisputeId.Value, cancellationToken);
        }

        var booking = await _context.Bookings
            .Include(b => b.Enrollment)
            .Include(b => b.StudentProfile)
            .FirstOrDefaultAsync(b => b.Id == refundTx.BookingId, cancellationToken);

        var enrollmentId = booking?.Enrollment?.Id ?? Guid.Empty;
        // Notifications must target the student's UserId, not the StudentProfile Id.
        var studentUserId = booking?.StudentProfile?.UserId ?? Guid.Empty;

        if (request.Outcome == TransactionStatus.Succeeded)
        {
            refundTx.Status = TransactionStatus.Succeeded;
            refundTx.RefundedAt = now;
            refundTx.SettlementRequired = false;
            if (!string.IsNullOrWhiteSpace(request.ProviderReference))
            {
                refundTx.PaymentGatewayRef = request.ProviderReference;
            }

            _context.AddOutboxMessage(new RefundCompletedEvent(
                enrollmentId,
                studentUserId,
                new MoneyDto(refundTx.Amount),
                refundTx.Id));
        }
        else
        {
            // TransactionStatus.Failed (DEC-S8-032, INV-REFUND-004)
            // Economic obligation remains outstanding; does not revert tutor debit or platform fee reversal
            refundTx.Status = TransactionStatus.Failed;
            refundTx.SettlementRequired = true;
            if (!string.IsNullOrWhiteSpace(request.FailureReason))
            {
                refundTx.Description = string.IsNullOrWhiteSpace(refundTx.Description)
                    ? $"Settlement failure: {request.FailureReason}"
                    : $"{refundTx.Description}; Settlement failure: {request.FailureReason}";
            }

            if (dispute != null)
            {
                dispute.MarkRequiresAdminRefundSettlement(request.FailureReason ?? "External settlement provider failed.");
            }

            _context.AddOutboxMessage(new RefundFailedEvent(
                enrollmentId,
                studentUserId,
                new MoneyDto(refundTx.Amount),
                refundTx.Id,
                request.FailureReason ?? "External refund settlement failed"));
        }

        // Central audit log (Slice D3)
        await _auditLogService.LogAsync(
            action: request.Outcome == TransactionStatus.Succeeded ? "RefundSettlementSucceeded" : "RefundSettlementFailed",
            entityName: "Transaction",
            entityId: refundTx.Id.ToString(),
            userId: request.AdminUserId,
            oldValues: new { Status = oldStatus.ToString() },
            newValues: new { Status = refundTx.Status.ToString(), SettlementRequired = refundTx.SettlementRequired, Reason = request.FailureReason },
            cancellationToken: cancellationToken);

        // Refund settlement mutates an in-flight (Pending) StudentRefund into a
        // terminal state; the append-only guard in AppDbContext permits this
        // because the original status is not Released/Succeeded (DEC-S8-032).
        await _context.SaveChangesAsync(cancellationToken);

        return new RefundCallbackResultDto
        {
            TransactionId = refundTx.Id,
            Status = refundTx.Status,
            SettlementRequired = refundTx.SettlementRequired,
            DisputeStatus = dispute?.Status.ToString(),
            Message = request.Outcome == TransactionStatus.Succeeded
                ? "External refund settled successfully."
                : "External refund settlement marked as failed; administrative settlement intervention required."
        };
    }
}
