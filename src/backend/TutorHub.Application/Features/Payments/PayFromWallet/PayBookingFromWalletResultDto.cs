namespace TutorHub.Application.Features.Payments.PayFromWallet;

public class PayBookingFromWalletResultDto
{
    public Guid BookingId { get; set; }
    public Guid TransactionId { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal RemainingBalance { get; set; }
    public DateTime PaidAt { get; set; }
}
