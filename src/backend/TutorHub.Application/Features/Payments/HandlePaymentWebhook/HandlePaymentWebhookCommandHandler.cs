using System.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Payments;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Payments.HandlePaymentWebhook;

public class HandlePaymentWebhookCommandHandler : IRequestHandler<HandlePaymentWebhookCommand, PaymentWebhookAck>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly IPaymentGateway _paymentGateway;
    private readonly IEnrollmentActivationService _activationService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<HandlePaymentWebhookCommandHandler> _logger;

    public HandlePaymentWebhookCommandHandler(
        IAppDbContext context, IClock clock,
        IPaymentGateway paymentGateway,
        IEnrollmentActivationService activationService,
        IAuditLogService auditLogService,
        ILogger<HandlePaymentWebhookCommandHandler> logger)
    {
        _context = context;
        _clock = clock;
        _paymentGateway = paymentGateway;
        _activationService = activationService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<PaymentWebhookAck> Handle(HandlePaymentWebhookCommand request, CancellationToken cancellationToken)
    {
        var parsed = _paymentGateway.VerifyAndParseCallback(request.Parameters);

        if (!parsed.IsVerified)
        {
            _logger.LogWarning("Payment webhook rejected: {Error}.", parsed.Error);
            return _paymentGateway.BuildAcknowledgement(parsed.Error == PaymentCallbackError.InvalidSignature
                ? PaymentWebhookOutcome.InvalidSignature
                : PaymentWebhookOutcome.InvalidRequest);
        }

        var txnRef = parsed.MerchantReference!;
        var transactionNo = parsed.ProviderTransactionId;
        var amount = parsed.Amount;

        _logger.LogInformation("Payment webhook received: TxnRef={TxnRef}, Amount={Amount}, Success={Success}",
            txnRef, amount, parsed.IsSuccessful);

        // Atomic DB Transaction with row-level serialization of duplicate webhooks.
        var executionStrategy = _context.Database.CreateExecutionStrategy();

        return await executionStrategy.ExecuteAsync(async () =>
        {
            using var dbTx = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);

            var transactionId = await _context.Transactions
                .AsNoTracking()
                .Where(t => t.PaymentGatewayRef == txnRef || t.PaymentGatewayRef == $"{txnRef}|{transactionNo}")
                .Select(t => (Guid?)t.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (transactionId == null)
            {
                _logger.LogWarning("Payment webhook: Order not found for TxnRef={TxnRef}", txnRef);
                return _paymentGateway.BuildAcknowledgement(PaymentWebhookOutcome.NotFound);
            }

            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"SELECT 1 FROM \"Transactions\" WHERE \"Id\" = {transactionId.Value} FOR UPDATE",
                cancellationToken);

            var transaction = await _context.Transactions
                .Include(t => t.Booking).ThenInclude(b => b.StudentProfile).ThenInclude(s => s.User)
                .Include(t => t.Booking).ThenInclude(b => b.TutorProfile).ThenInclude(t => t.User)
                .FirstOrDefaultAsync(t => t.Id == transactionId.Value, cancellationToken);

            if (transaction == null)
            {
                _logger.LogWarning("Payment webhook: Order not found for TxnRef={TxnRef}", txnRef);
                return _paymentGateway.BuildAcknowledgement(PaymentWebhookOutcome.NotFound);
            }

            if (transaction.Amount != amount)
            {
                _logger.LogWarning("Payment webhook: Amount mismatch. Expected={Expected}, Received={Received}", transaction.Amount, amount);
                return _paymentGateway.BuildAcknowledgement(PaymentWebhookOutcome.InvalidAmount);
            }

            if (transaction.Booking.Status != BookingStatus.Holding)
            {
                return await HandleNonHoldingBookingAsync(
                    transaction, txnRef, transactionNo, parsed.IsSuccessful, dbTx, cancellationToken);
            }

            var now = _clock.UtcNow;

            if (parsed.IsSuccessful)
            {
                transaction.Status = TransactionStatus.Held;
                transaction.PaymentGatewayRef = $"{txnRef}|{transactionNo}";

                transaction.Booking.Status = BookingStatus.Paid;
                transaction.Booking.ConfirmedAt = now;

                if (transaction.Booking.ServiceId.HasValue)
                {
                    await _activationService.ActivateAsync(transaction.Booking, now, cancellationToken);
                }

                try
                {
                    await _context.SaveChangesAsync(cancellationToken);
                }
                catch (DbUpdateException ex) when (IsDuplicateEnrollmentViolation(ex))
                {
                    await dbTx.RollbackAsync(cancellationToken);
                    _logger.LogInformation("Payment webhook: concurrent activation for Booking #{BookingId}; treated as already confirmed.", transaction.BookingId);
                    return _paymentGateway.BuildAcknowledgement(PaymentWebhookOutcome.Duplicate);
                }

                await dbTx.CommitAsync(cancellationToken);

                _logger.LogInformation("Payment webhook processed: Booking #{BookingId} confirmed, Transaction #{TxId} held.",
                    transaction.BookingId, transaction.Id);

                return _paymentGateway.BuildAcknowledgement(PaymentWebhookOutcome.Success);
            }

            _logger.LogInformation("Payment webhook: Payment reported unsuccessful for TxnRef={TxnRef}", txnRef);
            await dbTx.CommitAsync(cancellationToken);
            return _paymentGateway.BuildAcknowledgement(PaymentWebhookOutcome.Success);
        });
    }

    private async Task<PaymentWebhookAck> HandleNonHoldingBookingAsync(
        Transaction transaction,
        string txnRef,
        string? transactionNo,
        bool isSuccessful,
        IDbContextTransaction dbTx,
        CancellationToken cancellationToken)
    {
        var booking = transaction.Booking;

        if (!isSuccessful)
        {
            await dbTx.CommitAsync(cancellationToken);
            return _paymentGateway.BuildAcknowledgement(PaymentWebhookOutcome.Success);
        }

        var alreadyActivated = booking.Status == BookingStatus.Paid
            || await _context.Enrollments.AnyAsync(e => e.BookingId == booking.Id, cancellationToken);
        if (alreadyActivated)
        {
            _logger.LogInformation("Payment webhook: Order already processed. Current Status={Status}", booking.Status);
            await dbTx.CommitAsync(cancellationToken);
            return _paymentGateway.BuildAcknowledgement(PaymentWebhookOutcome.Duplicate);
        }

        var now = _clock.UtcNow;
        transaction.Status = TransactionStatus.Held;
        transaction.PaymentGatewayRef = $"{txnRef}|{transactionNo}";

        if (booking.CancelledBy == CancelledBy.System)
        {
            booking.ReactivateForPayment(now);

            if (booking.ServiceId.HasValue)
            {
                await _activationService.ActivateAsync(booking, now, cancellationToken);
            }

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex) when (IsDuplicateEnrollmentViolation(ex))
            {
                await dbTx.RollbackAsync(cancellationToken);
                return _paymentGateway.BuildAcknowledgement(PaymentWebhookOutcome.Duplicate);
            }

            await dbTx.CommitAsync(cancellationToken);
            _logger.LogInformation("Payment webhook: late payment revived expired Booking #{BookingId}.", booking.Id);
            return _paymentGateway.BuildAcknowledgement(PaymentWebhookOutcome.Success);
        }

        var refundTx = Transaction.CreateRefund(
            bookingId: booking.Id,
            sessionId: null,
            disputeId: null,
            originalPayout: null,
            amount: transaction.Amount,
            paymentGatewayRef: $"LateIpnRefund-{transaction.Id:N}",
            description: "Late payment webhook for a cancelled booking; refund required.",
            now: now);
        refundTx.SettlementRequired = true;
        _context.Transactions.Add(refundTx);

        _context.AddOutboxMessage(new RefundCreatedEvent(
            booking.Id,
            booking.StudentProfile.UserId,
            new MoneyDto(transaction.Amount),
            refundTx.Id));

        await _auditLogService.LogAsync(
            action: "LateIpnRefundRequired",
            entityName: "Transaction",
            entityId: refundTx.Id.ToString(),
            userId: booking.StudentProfile.UserId,
            oldValues: new { BookingStatus = booking.Status.ToString() },
            newValues: new { RefundAmount = transaction.Amount, SettlementRequired = true },
            cancellationToken: cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);
        await dbTx.CommitAsync(cancellationToken);
        _logger.LogInformation("Payment webhook: captured payment on cancelled Booking #{BookingId} flagged for refund.", booking.Id);
        return _paymentGateway.BuildAcknowledgement(PaymentWebhookOutcome.Success);
    }

    private static bool IsDuplicateEnrollmentViolation(DbUpdateException ex)
    {
        var inner = ex.InnerException;
        if (inner == null)
        {
            return false;
        }

        var msg = inner.Message;
        var constraint = inner.GetType().GetProperty("ConstraintName")?.GetValue(inner) as string;
        var sqlState = inner.GetType().GetProperty("SqlState")?.GetValue(inner) as string;

        var isUnique = sqlState == "23505" || msg.Contains("23505", StringComparison.OrdinalIgnoreCase);
        var isEnrollmentIndex = string.Equals(constraint, "IX_Enrollments_BookingId", StringComparison.OrdinalIgnoreCase)
            || msg.Contains("IX_Enrollments_BookingId", StringComparison.OrdinalIgnoreCase)
            || msg.Contains("Enrollments_BookingId", StringComparison.OrdinalIgnoreCase);

        return isUnique && isEnrollmentIndex;
    }
}
