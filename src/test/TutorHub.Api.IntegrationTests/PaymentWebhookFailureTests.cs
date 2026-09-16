using System.Globalization;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Payments;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Application.Features.Payments.HandlePaymentWebhook;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// P0-F2: a declined payment must be acknowledged (VNPay retries otherwise) without
/// moving any money — no enrollment, no escrow, and the gateway attempt stays
/// unsettled so the 15-minute hold can still expire normally.
/// </summary>
public class PaymentWebhookFailureTests : IntegrationTestBase
{
    public PaymentWebhookFailureTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task FailedIpn_OnHoldingBooking_LeavesHoldIntactAndIsAcknowledged()
    {
        // Arrange
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);

        SetCurrentUser(studentUser.Id, UserRole.Student);
        var bookingDto = await SendAsync(new CreateBookingCommand(service.Id));

        var booking = await Db.Bookings.FirstAsync(b => b.Id == bookingDto.Id);

        var paymentAttempt = new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            Amount = booking.TotalPrice,
            Type = TransactionType.BookingPayment,
            Status = TransactionStatus.Pending,
            PaymentGatewayRef = $"REF-{booking.Id:N}",
            CreatedAt = DateTime.UtcNow
        };
        Db.Transactions.Add(paymentAttempt);
        await Db.SaveChangesAsync();

        var handler = new HandlePaymentWebhookCommandHandler(
            Db,
            StubIntegrationClock.Instance,
            new DecliningPaymentGateway(),
            Scope.ServiceProvider.GetRequiredService<IEnrollmentActivationService>(),
            Scope.ServiceProvider.GetRequiredService<IAuditLogService>(),
            NullLogger<HandlePaymentWebhookCommandHandler>.Instance);

        var parameters = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["vnp_TmnCode"] = "TESTTMN",
            ["vnp_CurrCode"] = "VND",
            ["vnp_TxnRef"] = paymentAttempt.PaymentGatewayRef!,
            ["vnp_ResponseCode"] = "24",
            ["vnp_TransactionStatus"] = "02",
            ["vnp_TransactionNo"] = "555000222",
            ["vnp_Amount"] = (paymentAttempt.Amount * 100m).ToString(CultureInfo.InvariantCulture),
            ["vnp_SecureHash"] = "dummy"
        };

        // Act
        var result = await handler.Handle(new HandlePaymentWebhookCommand(parameters), CancellationToken.None);

        // Assert: acknowledged (VNPay must not keep retrying) but nothing moved.
        result.Code.Should().Be("00");

        var freshBooking = await Db.Bookings.AsNoTracking().FirstAsync(b => b.Id == booking.Id);
        freshBooking.Status.Should().Be(BookingStatus.Holding);

        var freshAttempt = await Db.Transactions.AsNoTracking().FirstAsync(t => t.Id == paymentAttempt.Id);
        freshAttempt.Status.Should().Be(TransactionStatus.Pending);

        var activated = await Db.Enrollments.AsNoTracking().AnyAsync(e => e.BookingId == booking.Id);
        activated.Should().BeFalse("a declined payment must never activate an enrollment");

        var wallet = await Db.Wallets.AsNoTracking().FirstAsync(w => w.TutorProfileId == tutor.Id);
        wallet.PendingBalance.Should().Be(0m, "escrow is only funded by a verified successful payment");
        wallet.AvailableBalance.Should().Be(1_000_000m);
    }

    private sealed class DecliningPaymentGateway : IPaymentGateway
    {
        public string CreateRedirect(PaymentRedirectRequest request) => "https://sandbox.test/pay";

        public PaymentCallbackResult VerifyAndParseCallback(IReadOnlyDictionary<string, string> parameters)
        {
            parameters.TryGetValue("vnp_TxnRef", out var txnRef);
            parameters.TryGetValue("vnp_Amount", out var amountStr);
            parameters.TryGetValue("vnp_TransactionNo", out var transactionNo);
            decimal.TryParse(amountStr, NumberStyles.Number, CultureInfo.InvariantCulture, out var rawAmount);

            return new PaymentCallbackResult(
                IsVerified: true,
                Error: null,
                MerchantReference: txnRef,
                Amount: rawAmount / 100m,
                IsSuccessful: false,
                ProviderTransactionId: transactionNo);
        }

        public PaymentWebhookAck BuildAcknowledgement(PaymentWebhookOutcome outcome)
        {
            return outcome switch
            {
                PaymentWebhookOutcome.Success => new PaymentWebhookAck("00", "Confirm Success"),
                PaymentWebhookOutcome.Duplicate => new PaymentWebhookAck("02", "Order already confirmed"),
                PaymentWebhookOutcome.NotFound => new PaymentWebhookAck("01", "Order not found"),
                PaymentWebhookOutcome.InvalidAmount => new PaymentWebhookAck("04", "Invalid amount"),
                PaymentWebhookOutcome.InvalidSignature => new PaymentWebhookAck("97", "Invalid Checksum"),
                _ => new PaymentWebhookAck("99", "Invalid Request"),
            };
        }
    }
}
