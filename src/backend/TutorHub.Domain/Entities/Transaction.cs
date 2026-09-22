using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class Transaction
{
    public Guid Id { get; set; }

    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = default!;

    // Payout session linkage (nullable for initial booking payment, set for per-session payouts)
    public Guid? SessionId { get; set; }
    public Session? Session { get; set; }

    // Payment
    public decimal Amount { get; set; }

    public TransactionType Type { get; set; } = TransactionType.BookingPayment;

    public TransactionStatus Status { get; set; }

    // Platform commission
    public decimal CommissionRate { get; set; }

    public decimal CommissionAmount { get; set; }

    // Amount paid to tutor
    public decimal PayoutAmount { get; set; }

    public string? PaymentGatewayRef { get; set; }

    // Linkages for dispute resolution & explicit adjustments (DEC-S8-025, DEC-S8-030)
    public Guid? DisputeId { get; set; }
    public Guid? RelatedTransactionId { get; set; }
    public Transaction? RelatedTransaction { get; set; }
    public string? Description { get; set; }
    public bool SettlementRequired { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ReleasedAt { get; set; }

    public DateTime? RefundedAt { get; set; }

    // F-23: explicit factories so every ledger row is created with the
    // correct Type/Status/refs. Chaining stays forbidden (DEC-S8-030):
    // adjustments must reference the original payout (validated again in
    // AdminResolveDispute + AppDbContext.SaveChangesAsync).

    public static Transaction CreatePayout(
        Guid bookingId,
        Guid sessionId,
        Guid? disputeId,
        decimal gross,
        decimal feeRate,
        decimal feeAmount,
        decimal netPayout,
        string paymentGatewayRef,
        DateTime now)
    {
        if (gross <= 0)
            throw new ArgumentException("Gross amount must be positive.", nameof(gross));
        if (netPayout < 0)
            throw new ArgumentException("Net payout cannot be negative.", nameof(netPayout));

        return new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            SessionId = sessionId,
            DisputeId = disputeId,
            Type = TransactionType.SessionPayoutCredit,
            Amount = gross,
            CommissionRate = feeRate,
            CommissionAmount = feeAmount,
            PayoutAmount = netPayout,
            PaymentGatewayRef = paymentGatewayRef,
            Status = TransactionStatus.Released,
            CreatedAt = now,
            ReleasedAt = now
        };
    }

    public static Transaction CreateRefund(
        Guid bookingId,
        Guid? sessionId,
        Guid? disputeId,
        Transaction? originalPayout,
        decimal amount,
        string paymentGatewayRef,
        string? description,
        DateTime now)
    {
        if (amount <= 0)
            throw new ArgumentException("Refund amount must be positive.", nameof(amount));
        if (originalPayout != null && originalPayout.Type != TransactionType.SessionPayoutCredit)
            throw new ArgumentException(
                "Refunds must reference the original payout transaction (DEC-S8-030).",
                nameof(originalPayout));

        return new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            SessionId = sessionId,
            DisputeId = disputeId,
            RelatedTransactionId = originalPayout?.Id,
            Type = TransactionType.StudentRefund,
            Amount = amount,
            CommissionRate = 0,
            CommissionAmount = 0,
            PayoutAmount = 0,
            PaymentGatewayRef = paymentGatewayRef,
            Status = TransactionStatus.Pending,
            Description = description,
            CreatedAt = now
        };
    }

    public static Transaction CreateFeeReversal(
        Guid bookingId,
        Guid? sessionId,
        Guid? disputeId,
        Transaction originalPayout,
        decimal feeRate,
        decimal feeReversalAmount,
        string paymentGatewayRef,
        DateTime now)
    {
        if (originalPayout.Type != TransactionType.SessionPayoutCredit)
            throw new ArgumentException(
                "Fee reversals must reference the original payout transaction (DEC-S8-030).",
                nameof(originalPayout));
        if (feeReversalAmount < 0)
            throw new ArgumentException("Fee reversal cannot be negative.", nameof(feeReversalAmount));

        return new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            SessionId = sessionId,
            DisputeId = disputeId,
            RelatedTransactionId = originalPayout.Id,
            Type = TransactionType.PlatformFeeReversal,
            Amount = feeReversalAmount,
            CommissionRate = feeRate,
            CommissionAmount = feeReversalAmount,
            PayoutAmount = 0,
            PaymentGatewayRef = paymentGatewayRef,
            Status = TransactionStatus.Succeeded,
            CreatedAt = now
        };
    }
}