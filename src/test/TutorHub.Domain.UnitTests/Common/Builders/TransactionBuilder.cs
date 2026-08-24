using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Domain.UnitTests.Common.Builders;

public class TransactionBuilder
{
    private static readonly DateTime DefaultCreatedAt = new(2030, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private Guid _id = Guid.NewGuid();
    private Guid _bookingId = Guid.NewGuid();
    private decimal _amount = 200_000m;
    private decimal _commissionRate = 10m;
    private decimal? _customCommissionAmount;
    private decimal? _customPayoutAmount;
    private TransactionStatus _status = TransactionStatus.Held;
    private string? _paymentGatewayRef = "VNPAY12345678";
    private DateTime? _releasedAt;
    private DateTime? _refundedAt;

    public TransactionBuilder WithId(Guid id)
    {
        _id = id;
        return this;
    }

    public TransactionBuilder WithBookingId(Guid bookingId)
    {
        _bookingId = bookingId;
        return this;
    }

    public TransactionBuilder WithAmount(decimal amount)
    {
        _amount = amount;
        return this;
    }

    public TransactionBuilder WithCommissionRate(decimal rate)
    {
        _commissionRate = rate;
        return this;
    }

    public TransactionBuilder WithStatus(TransactionStatus status)
    {
        _status = status;
        return this;
    }

    public TransactionBuilder WithCustomAmounts(decimal commissionAmount, decimal payoutAmount)
    {
        _customCommissionAmount = commissionAmount;
        _customPayoutAmount = payoutAmount;
        return this;
    }

    public TransactionBuilder WithReleasedAt(DateTime? releasedAt)
    {
        _releasedAt = releasedAt;
        return this;
    }

    public TransactionBuilder WithRefundedAt(DateTime? refundedAt)
    {
        _refundedAt = refundedAt;
        return this;
    }

    public Transaction Build()
    {
        // Derive commission and payout consistently unless explicitly customized
        var commissionAmount = _customCommissionAmount ?? (_amount * _commissionRate / 100m);
        var payoutAmount = _customPayoutAmount ?? (_amount - commissionAmount);

        return new Transaction
        {
            Id = _id,
            BookingId = _bookingId,
            Amount = _amount,
            Status = _status,
            CommissionRate = _commissionRate,
            CommissionAmount = commissionAmount,
            PayoutAmount = payoutAmount,
            PaymentGatewayRef = _paymentGatewayRef,
            CreatedAt = DefaultCreatedAt,
            ReleasedAt = _releasedAt,
            RefundedAt = _refundedAt
        };
    }
}
