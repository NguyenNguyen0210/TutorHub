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

    public TransactionStatus Status { get; set; }

    // Platform commission
    public decimal CommissionRate { get; set; }

    public decimal CommissionAmount { get; set; }

    // Amount paid to tutor
    public decimal PayoutAmount { get; set; }

    public string? PaymentGatewayRef { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ReleasedAt { get; set; }

    public DateTime? RefundedAt { get; set; }
}