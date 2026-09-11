using System.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Application.Features.Payments.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Payments.ProcessVnPayIpn;

public class ProcessVnPayIpnCommandHandler : IRequestHandler<ProcessVnPayIpnCommand, VnPayIpnResponseDto>
{
    private readonly IAppDbContext _context;
    private readonly IVnPayService _vnPayService;
    private readonly IEnrollmentActivationService _activationService;
    private readonly ILogger<ProcessVnPayIpnCommandHandler> _logger;

    public ProcessVnPayIpnCommandHandler(
        IAppDbContext context,
        IVnPayService vnPayService,
        IEnrollmentActivationService activationService,
        ILogger<ProcessVnPayIpnCommandHandler> logger)
    {
        _context = context;
        _vnPayService = vnPayService;
        _activationService = activationService;
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

            // 7. Idempotency Guard
            if (transaction.Booking.Status != BookingStatus.Holding)
            {
                _logger.LogInformation("VNPay IPN: Order already processed. Current Status={Status}", transaction.Booking.Status);
                return new VnPayIpnResponseDto("02", "Order already confirmed");
            }

            var now = DateTime.UtcNow;

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
