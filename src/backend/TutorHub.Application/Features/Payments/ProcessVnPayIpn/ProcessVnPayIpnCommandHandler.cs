using System.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Application.Features.Payments.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Payments.ProcessVnPayIpn;

public class ProcessVnPayIpnCommandHandler : IRequestHandler<ProcessVnPayIpnCommand, VnPayIpnResponseDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly IVnPayService _vnPayService;
    private readonly IEnrollmentActivationService _activationService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<ProcessVnPayIpnCommandHandler> _logger;

    public ProcessVnPayIpnCommandHandler(
        IAppDbContext context, IClock clock,
        IVnPayService vnPayService,
        IEnrollmentActivationService activationService,
        IAuditLogService auditLogService,
        ILogger<ProcessVnPayIpnCommandHandler> logger)
    {
        _context = context;
        _clock = clock;
        _vnPayService = vnPayService;
        _activationService = activationService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<VnPayIpnResponseDto> Handle(ProcessVnPayIpnCommand request, CancellationToken cancellationToken)
    {
        var parameters = request.Parameters;

        // 1. Signature Checksum Validation
        if (!parameters.TryGetValue("vnp_SecureHash", out var secureHash) || string.IsNullOrWhiteSpace(secureHash))
        {
            _logger.LogWarning("VNPay IPN rejected: missing vnp_SecureHash.");
            return new VnPayIpnResponseDto("97", "Invalid Checksum");
        }

        if (!_vnPayService.VerifySignature(parameters, secureHash))
        {
            _logger.LogWarning("VNPay IPN rejected: invalid signature checksum.");
            return new VnPayIpnResponseDto("97", "Invalid Checksum");
        }

        // 2. Merchant Code Validation
        parameters.TryGetValue("vnp_TmnCode", out var tmnCode);
        if (string.IsNullOrWhiteSpace(tmnCode) || !string.Equals(tmnCode, _vnPayService.GetTmnCode(), StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("VNPay IPN rejected: invalid TmnCode {TmnCode}.", tmnCode);
            return new VnPayIpnResponseDto("99", "Invalid Merchant Code");
        }

        // 3. Currency Validation
        parameters.TryGetValue("vnp_CurrCode", out var currCode);
        if (!string.Equals(currCode, "VND", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("VNPay IPN rejected: invalid currency {CurrCode}.", currCode);
            return new VnPayIpnResponseDto("99", "Invalid Currency");
        }

        // 4. Extract Required Parameters
        parameters.TryGetValue("vnp_TxnRef", out var txnRef);
        parameters.TryGetValue("vnp_ResponseCode", out var responseCode);
        parameters.TryGetValue("vnp_TransactionStatus", out var transactionStatus);
        parameters.TryGetValue("vnp_TransactionNo", out var transactionNo);
        parameters.TryGetValue("vnp_Amount", out var amountStr);

        if (string.IsNullOrWhiteSpace(txnRef) || !decimal.TryParse(amountStr, out var rawAmount))
        {
            _logger.LogWarning("VNPay IPN rejected: malformed parameters.");
            return new VnPayIpnResponseDto("99", "Malformed parameters");
        }

        var amount = rawAmount / 100m;

        _logger.LogInformation("VNPay IPN received: TxnRef={TxnRef}, Amount={Amount}, ResponseCode={ResponseCode}, Status={Status}",
            txnRef, amount, responseCode, transactionStatus);

        // 5. Atomic DB Transaction with row-level serialization of duplicate IPNs.
        var executionStrategy = _context.Database.CreateExecutionStrategy();

        return await executionStrategy.ExecuteAsync(async () =>
        {
            using var dbTx = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);

            // Resolve the gateway attempt, then lock its row so concurrent duplicate
            // or late IPNs are serialized (idempotency + no double credit).
            var transactionId = await _context.Transactions
                .AsNoTracking()
                .Where(t => t.PaymentGatewayRef == txnRef || t.PaymentGatewayRef == $"{txnRef}|{transactionNo}")
                .Select(t => (Guid?)t.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (transactionId == null)
            {
                _logger.LogWarning("VNPay IPN: Order not found for TxnRef={TxnRef}", txnRef);
                return new VnPayIpnResponseDto("01", "Order not found");
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
                _logger.LogWarning("VNPay IPN: Order not found for TxnRef={TxnRef}", txnRef);
                return new VnPayIpnResponseDto("01", "Order not found");
            }

            // 6. Amount Invariant Check
            if (transaction.Amount != amount)
            {
                _logger.LogWarning("VNPay IPN: Amount mismatch. Expected={Expected}, Received={Received}", transaction.Amount, amount);
                return new VnPayIpnResponseDto("04", "Invalid amount");
            }

            // 7. A non-Holding booking may still hold captured money (late IPN).
            if (transaction.Booking.Status != BookingStatus.Holding)
            {
                return await HandleNonHoldingBookingAsync(
                    transaction, txnRef, transactionNo, responseCode, transactionStatus, dbTx, cancellationToken);
            }

            var now = _clock.UtcNow;

            // 8. Process Success Status Transition
            if (responseCode == "00" && transactionStatus == "00")
            {
                transaction.Status = TransactionStatus.Held;
                transaction.PaymentGatewayRef = $"{txnRef}|{transactionNo}";

                transaction.Booking.Status = BookingStatus.Paid;
                transaction.Booking.ConfirmedAt = now;

                // Shared activation: snapshots fee, spawns N sessions and credits
                // the GROSS escrow amount.
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
                    // A concurrent IPN already activated this booking; idempotent success.
                    await dbTx.RollbackAsync(cancellationToken);
                    _logger.LogInformation("VNPay IPN: concurrent activation detected for Booking #{BookingId}; treated as already confirmed.", transaction.BookingId);
                    return new VnPayIpnResponseDto("02", "Order already confirmed");
                }

                await dbTx.CommitAsync(cancellationToken);

                _logger.LogInformation("VNPay IPN processed successfully: Booking #{BookingId} confirmed, Transaction #{TxId} held.",
                    transaction.BookingId, transaction.Id);

                return new VnPayIpnResponseDto("00", "Confirm Success");
            }

            // Failed payment by user/gateway - acknowledge IPN without money movement
            _logger.LogInformation("VNPay IPN: Payment failed with code {ResponseCode}", responseCode);
            await dbTx.CommitAsync(cancellationToken);
            return new VnPayIpnResponseDto("00", "Confirm Success");
        });
    }

    private async Task<VnPayIpnResponseDto> HandleNonHoldingBookingAsync(
        Transaction transaction,
        string txnRef,
        string? transactionNo,
        string? responseCode,
        string? transactionStatus,
        IDbContextTransaction dbTx,
        CancellationToken cancellationToken)
    {
        var booking = transaction.Booking;

        // A failure notification captured no money; acknowledge without mutation.
        if (responseCode != "00" || transactionStatus != "00")
        {
            await dbTx.CommitAsync(cancellationToken);
            return new VnPayIpnResponseDto("00", "Confirm Success");
        }

        var alreadyActivated = booking.Status == BookingStatus.Paid
            || await _context.Enrollments.AnyAsync(e => e.BookingId == booking.Id, cancellationToken);
        if (alreadyActivated)
        {
            _logger.LogInformation("VNPay IPN: Order already processed. Current Status={Status}", booking.Status);
            await dbTx.CommitAsync(cancellationToken);
            return new VnPayIpnResponseDto("02", "Order already confirmed");
        }

        var now = _clock.UtcNow;
        transaction.Status = TransactionStatus.Held;
        transaction.PaymentGatewayRef = $"{txnRef}|{transactionNo}";

        if (booking.CancelledBy == CancelledBy.System)
        {
            // The 15-minute hold expired and a background job cancelled the booking,
            // but the student did pay. Honor the payment intent: revive + activate.
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
                return new VnPayIpnResponseDto("02", "Order already confirmed");
            }

            await dbTx.CommitAsync(cancellationToken);
            _logger.LogInformation("VNPay IPN: late payment revived expired Booking #{BookingId}.", booking.Id);
            return new VnPayIpnResponseDto("00", "Confirm Success");
        }

        // Cancelled by student/tutor/admin: money was captured but no service will
        // be delivered. Record an explicit refund obligation (DEC-S8-032).
        var refundTx = Transaction.CreateRefund(
            bookingId: booking.Id,
            sessionId: null,
            disputeId: null,
            originalPayout: null,
            amount: transaction.Amount,
            paymentGatewayRef: $"LateIpnRefund-{transaction.Id:N}",
            description: "Late VNPay IPN for a cancelled booking; refund required.",
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
        _logger.LogInformation("VNPay IPN: captured payment on cancelled Booking #{BookingId} flagged for refund.", booking.Id);
        return new VnPayIpnResponseDto("00", "Confirm Success");
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
