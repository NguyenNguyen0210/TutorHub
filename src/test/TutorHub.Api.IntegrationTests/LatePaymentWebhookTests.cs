using System.Globalization;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Payments;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Bookings.CancelBooking;
using TutorHub.Application.Features.Bookings.ProcessBookingTimeouts;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Application.Features.Payments.HandlePaymentWebhook;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// C5 regression: a successful payment webhook arriving after hold expiry/cancellation
/// must never swallow captured money.
/// </summary>
public class LatePaymentWebhookTests : IntegrationTestBase
{
    public LatePaymentWebhookTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    private async Task<(Booking Booking, Transaction Tx)> SeedNonHoldingBookingAsync(
        BookingStatus status, CancelledBy cancelledBy)
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);

        SetCurrentUser(studentUser.Id, UserRole.Student);

        var dto = await SendAsync(new CreateBookingCommand(service.Id));

        var booking = await Db.Bookings
            .Include(b => b.StudentProfile)
            .Include(b => b.TutorProfile)
            .FirstAsync(b => b.Id == dto.Id);

        var tx = new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            Amount = booking.TotalPrice,
            Type = TransactionType.BookingPayment,
            Status = TransactionStatus.Held,
            PaymentGatewayRef = $"REF-{booking.Id:N}",
            CreatedAt = DateTime.UtcNow
        };
        Db.Transactions.Add(tx);

        booking.Status = status;
        if (status == BookingStatus.Cancelled)
        {
            booking.CancelledBy = cancelledBy;
            booking.CancelledAt = DateTime.UtcNow;
            booking.CancellationReason = cancelledBy == CancelledBy.System ? "HoldingExpired" : "cancelled by actor";
        }

        await Db.SaveChangesAsync();
        return (booking, tx);
    }

    private HandlePaymentWebhookCommandHandler CreateHandler() => new(
        Db,
        StubIntegrationClock.Instance,
        new AlwaysValidPaymentGateway(),
        Scope.ServiceProvider.GetRequiredService<IEnrollmentActivationService>(),
        Scope.ServiceProvider.GetRequiredService<IAuditLogService>(),
        NullLogger<HandlePaymentWebhookCommandHandler>.Instance);

    private static Dictionary<string, string> BuildSuccessIpn(Transaction tx) => new(StringComparer.OrdinalIgnoreCase)
    {
        ["vnp_TmnCode"] = "TESTTMN",
        ["vnp_CurrCode"] = "VND",
        ["vnp_TxnRef"] = tx.PaymentGatewayRef!,
        ["vnp_ResponseCode"] = "00",
        ["vnp_TransactionStatus"] = "00",
        ["vnp_TransactionNo"] = "987654321",
        ["vnp_Amount"] = (tx.Amount * 100m).ToString(CultureInfo.InvariantCulture),
        ["vnp_SecureHash"] = "dummy"
    };

    [Fact]
    public async Task LateSuccessIpn_OnSystemExpiredBooking_RevivesAndActivates()
    {
        var (booking, tx) = await SeedNonHoldingBookingAsync(BookingStatus.Cancelled, CancelledBy.System);

        var result = await CreateHandler().Handle(new HandlePaymentWebhookCommand(BuildSuccessIpn(tx)), CancellationToken.None);

        result.Code.Should().Be("00");

        var freshBooking = await Db.Bookings.AsNoTracking().FirstAsync(b => b.Id == booking.Id);
        freshBooking.Status.Should().Be(BookingStatus.Paid);

        var enrollment = await Db.Enrollments.AsNoTracking()
            .Include(e => e.Sessions)
            .FirstOrDefaultAsync(e => e.BookingId == booking.Id);
        enrollment.Should().NotBeNull();
        enrollment!.Status.Should().Be(EnrollmentStatus.Active);
        enrollment.Sessions.Should().HaveCount(3);
    }

    [Fact]
    public async Task LateSuccessIpn_OnStudentCancelledBooking_RecordsPendingRefund()
    {
        var (booking, tx) = await SeedNonHoldingBookingAsync(BookingStatus.Cancelled, CancelledBy.Student);

        var result = await CreateHandler().Handle(new HandlePaymentWebhookCommand(BuildSuccessIpn(tx)), CancellationToken.None);

        result.Code.Should().Be("00");

        var freshBooking = await Db.Bookings.AsNoTracking().FirstAsync(b => b.Id == booking.Id);
        freshBooking.Status.Should().Be(BookingStatus.Cancelled);

        (await Db.Enrollments.AsNoTracking().AnyAsync(e => e.BookingId == booking.Id)).Should().BeFalse();

        var refund = await Db.Transactions.AsNoTracking()
            .FirstOrDefaultAsync(t => t.BookingId == booking.Id && t.Type == TransactionType.StudentRefund);
        refund.Should().NotBeNull();
        refund!.Amount.Should().Be(900_000m);
        refund.Status.Should().Be(TransactionStatus.Pending);
        refund.SettlementRequired.Should().BeTrue();
    }

    [Fact]
    public async Task LateSuccessIpn_OnAlreadyPaidBooking_IsIdempotent()
    {
        var (booking, tx) = await SeedNonHoldingBookingAsync(BookingStatus.Paid, CancelledBy.System);

        var result = await CreateHandler().Handle(new HandlePaymentWebhookCommand(BuildSuccessIpn(tx)), CancellationToken.None);

        result.Code.Should().Be("02");
        (await Db.Enrollments.AsNoTracking().AnyAsync(e => e.BookingId == booking.Id)).Should().BeFalse();
        (await Db.Transactions.AsNoTracking().AnyAsync(t => t.BookingId == booking.Id && t.Type == TransactionType.StudentRefund)).Should().BeFalse();
    }

    [Fact]
    public async Task LateSuccessIpn_ForUnpaidGatewayAttempt_AfterWalletPayment_RequiresRefund()
    {
        var (booking, tx) = await SeedNonHoldingBookingAsync(BookingStatus.Paid, CancelledBy.System);
        tx.Status = TransactionStatus.Pending;
        await Db.SaveChangesAsync();
        var parameters = BuildSuccessIpn(tx);

        var result = await CreateHandler().Handle(
            new HandlePaymentWebhookCommand(parameters), CancellationToken.None);

        result.Code.Should().Be("00");
        var refund = await Db.Transactions.AsNoTracking().SingleAsync(t =>
            t.BookingId == booking.Id && t.Type == TransactionType.StudentRefund);
        refund.SettlementRequired.Should().BeTrue();
        refund.Amount.Should().Be(tx.Amount);

        var duplicate = await CreateHandler().Handle(
            new HandlePaymentWebhookCommand(parameters), CancellationToken.None);
        duplicate.Code.Should().Be("02");
        (await Db.Transactions.AsNoTracking().CountAsync(t =>
            t.BookingId == booking.Id && t.Type == TransactionType.StudentRefund)).Should().Be(1);
    }

    [Fact]
    public async Task StudentCancellation_PreservesGatewayReference_ForLateRefund()
    {
        var (booking, tx) = await SeedNonHoldingBookingAsync(BookingStatus.Holding, CancelledBy.Student);
        tx.Status = TransactionStatus.Pending;
        await Db.SaveChangesAsync();
        var parameters = BuildSuccessIpn(tx);

        await SendAsync(new CancelBookingCommand(booking.Id, "Changed plans"));
        Db.ChangeTracker.Clear();

        var result = await CreateHandler().Handle(
            new HandlePaymentWebhookCommand(parameters), CancellationToken.None);

        result.Code.Should().Be("00");
        (await Db.Transactions.AsNoTracking().CountAsync(t =>
            t.BookingId == booking.Id && t.Type == TransactionType.StudentRefund)).Should().Be(1);
    }

    [Fact]
    public async Task Timeout_KeepsGatewayAttempt_AndLateSuccessRevivesBooking()
    {
        var (booking, payment) = await SeedNonHoldingBookingAsync(BookingStatus.Holding, CancelledBy.System);
        booking.HoldingExpiresAt = DateTime.UtcNow.AddMinutes(-1);
        await Db.SaveChangesAsync();

        var timeout = new ProcessBookingTimeoutsCommandHandler(
            Db, NullLogger<ProcessBookingTimeoutsCommandHandler>.Instance, StubIntegrationClock.Instance);
        (await timeout.Handle(new ProcessBookingTimeoutsCommand(), CancellationToken.None)).Should().BeGreaterThan(0);
        Db.ChangeTracker.Clear();

        (await Db.Bookings.AsNoTracking().SingleAsync(b => b.Id == booking.Id))
            .Status.Should().Be(BookingStatus.Expired);

        (await Db.Transactions.AsNoTracking().SingleAsync(t => t.Id == payment.Id))
            .Status.Should().Be(TransactionStatus.Held);
        var result = await CreateHandler().Handle(
            new HandlePaymentWebhookCommand(BuildSuccessIpn(payment)), CancellationToken.None);
        result.Code.Should().Be("00");
        (await Db.Bookings.AsNoTracking().SingleAsync(b => b.Id == booking.Id))
            .Status.Should().Be(BookingStatus.Paid);
    }

    [Fact]
    public async Task LegacyFailedAttempt_LateCaptureCreatesNewImmutablePaymentRow()
    {
        var (booking, payment) = await SeedNonHoldingBookingAsync(BookingStatus.Cancelled, CancelledBy.System);
        payment.Status = TransactionStatus.Failed;
        await Db.SaveChangesAsync();
        Db.ChangeTracker.Clear();

        var callback = new HandlePaymentWebhookCommand(BuildSuccessIpn(payment));
        (await CreateHandler().Handle(callback, CancellationToken.None)).Code.Should().Be("00");
        (await CreateHandler().Handle(callback, CancellationToken.None)).Code.Should().Be("02");

        var attempts = await Db.Transactions.AsNoTracking()
            .Where(t => t.BookingId == booking.Id && t.Type == TransactionType.BookingPayment)
            .ToListAsync();
        attempts.Should().HaveCount(2);
        attempts.Should().ContainSingle(t => t.Id == payment.Id && t.Status == TransactionStatus.Failed);
        attempts.Should().ContainSingle(t => t.Id != payment.Id && t.Status == TransactionStatus.Held);
    }

    [Fact]
    public async Task ConcurrentGatewayCaptures_ActivateOnce_AndRecordSecondRefund()
    {
        var (booking, first) = await SeedNonHoldingBookingAsync(BookingStatus.Holding, CancelledBy.System);
        first.Status = TransactionStatus.Pending;
        var second = new Transaction
        {
            Id = Guid.NewGuid(), BookingId = booking.Id, Type = TransactionType.BookingPayment,
            Status = TransactionStatus.Pending, Amount = first.Amount,
            PaymentGatewayRef = $"REF2-{booking.Id:N}", CreatedAt = DateTime.UtcNow
        };
        Db.Transactions.Add(second);
        await Db.SaveChangesAsync();

        async Task<PaymentWebhookAck> ProcessAsync(Transaction payment)
        {
            using var scope = Factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<TutorHub.Infrastructure.Persistence.AppDbContext>();
            var handler = new HandlePaymentWebhookCommandHandler(
                context, StubIntegrationClock.Instance, new AlwaysValidPaymentGateway(),
                scope.ServiceProvider.GetRequiredService<IEnrollmentActivationService>(),
                scope.ServiceProvider.GetRequiredService<IAuditLogService>(),
                NullLogger<HandlePaymentWebhookCommandHandler>.Instance);
            return await handler.Handle(
                new HandlePaymentWebhookCommand(BuildSuccessIpn(payment)), CancellationToken.None);
        }

        await using var blocker = await Db.Database.BeginTransactionAsync();
        await Db.Bookings.FromSqlInterpolated(
            $"SELECT * FROM \"Bookings\" WHERE \"Id\" = {booking.Id} FOR UPDATE")
            .AsNoTracking().FirstAsync();
        var firstTask = ProcessAsync(first);
        var secondTask = ProcessAsync(second);
        await Task.Delay(100);
        await blocker.CommitAsync();

        (await Task.WhenAll(firstTask, secondTask)).Should().OnlyContain(a => a.Code == "00");
        (await Db.Enrollments.AsNoTracking().CountAsync(e => e.BookingId == booking.Id)).Should().Be(1);
        (await Db.Transactions.AsNoTracking().CountAsync(t => t.BookingId == booking.Id &&
            t.Type == TransactionType.StudentRefund && t.SettlementRequired)).Should().Be(1);
    }

    private sealed class AlwaysValidPaymentGateway : IPaymentGateway
    {
        public string CreateRedirect(PaymentRedirectRequest request) => "https://sandbox.test/pay";

        public PaymentCallbackResult VerifyAndParseCallback(IReadOnlyDictionary<string, string> parameters)
        {
            parameters.TryGetValue("vnp_TxnRef", out var txnRef);
            parameters.TryGetValue("vnp_Amount", out var amountStr);
            parameters.TryGetValue("vnp_TransactionNo", out var transactionNo);
            decimal.TryParse(amountStr, out var rawAmount);

            return new PaymentCallbackResult(
                IsVerified: true,
                Error: null,
                MerchantReference: txnRef,
                Amount: rawAmount / 100m,
                IsSuccessful: true,
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
