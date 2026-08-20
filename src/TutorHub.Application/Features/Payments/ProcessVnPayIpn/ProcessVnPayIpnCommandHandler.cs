using System.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Payments.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Payments.ProcessVnPayIpn;

public class ProcessVnPayIpnCommandHandler : IRequestHandler<ProcessVnPayIpnCommand, VnPayIpnResponseDto>
{
    private readonly IAppDbContext _context;
    private readonly IVnPayService _vnPayService;
    private readonly ILogger<ProcessVnPayIpnCommandHandler> _logger;

    public ProcessVnPayIpnCommandHandler(
        IAppDbContext context,
        IVnPayService vnPayService,
        ILogger<ProcessVnPayIpnCommandHandler> logger)
    {
        _context = context;
        _vnPayService = vnPayService;
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

        var isValidSignature = _vnPayService.VerifySignature(parameters, secureHash);
        if (!isValidSignature)
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

        // 5. Atomic DB Transaction with Concurrency Protection
        var executionStrategy = _context.Database.CreateExecutionStrategy();

        return await executionStrategy.ExecuteAsync(async () =>
        {
            using var dbTx = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);

            var transaction = await _context.Transactions
                .Include(t => t.Booking)
                .FirstOrDefaultAsync(t => t.PaymentGatewayRef != null && t.PaymentGatewayRef.StartsWith(txnRef), cancellationToken);

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

            // 7. Idempotency Guard (If booking is already finalized or confirmed)
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

                transaction.Booking.Status = BookingStatus.Pending;
                transaction.Booking.ConfirmedAt = now;

                // Credit Tutor Wallet with PayoutAmount (NOT Gross TotalAmount)
                var wallet = await _context.Wallets
                    .FirstOrDefaultAsync(w => w.TutorProfileId == transaction.Booking.TutorProfileId, cancellationToken);

                if (wallet == null)
                {
                    wallet = new Wallet
                    {
                        Id = Guid.NewGuid(),
                        TutorProfileId = transaction.Booking.TutorProfileId,
                        PendingBalance = transaction.PayoutAmount,
                        AvailableBalance = 0,
                        UpdatedAt = now
                    };
                    _context.Wallets.Add(wallet);
                }
                else
                {
                    wallet.PendingBalance += transaction.PayoutAmount;
                    wallet.UpdatedAt = now;
                }

                await _context.SaveChangesAsync(cancellationToken);
                await dbTx.CommitAsync(cancellationToken);

                _logger.LogInformation("VNPay IPN processed successfully: Booking #{BookingId} confirmed, Transaction #{TxId} held.",
                    transaction.BookingId, transaction.Id);

                return new VnPayIpnResponseDto("00", "Confirm Success");
            }
            else
            {
                // Failed payment by user/gateway - acknowledge IPN without money movement
                _logger.LogInformation("VNPay IPN: Payment failed with code {ResponseCode}", responseCode);
                await dbTx.CommitAsync(cancellationToken);
                return new VnPayIpnResponseDto("00", "Confirm Success");
            }
        });
    }
}
