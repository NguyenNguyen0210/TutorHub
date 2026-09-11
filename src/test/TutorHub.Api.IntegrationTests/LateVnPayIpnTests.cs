using System.Globalization;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Payment;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Application.Features.Payments.ProcessVnPayIpn;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// C5 regression: a successful VNPay IPN arriving after hold expiry/cancellation
/// must never swallow captured money.
/// </summary>
public class LateVnPayIpnTests : IntegrationTestBase
{
    public LateVnPayIpnTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    private async Task<(Booking Booking, Transaction Tx)> SeedNonHoldingBookingAsync(
        BookingStatus status, CancelledBy cancelledBy)
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);

        var dto = await SendAsync(new CreateBookingCommand(studentUser.Id, service.Id));

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

    private ProcessVnPayIpnCommandHandler CreateHandler() => new(
        Db,
        new AlwaysValidVnPayService(),
        Scope.ServiceProvider.GetRequiredService<IEnrollmentActivationService>(),
        Scope.ServiceProvider.GetRequiredService<IAuditLogService>(),
        NullLogger<ProcessVnPayIpnCommandHandler>.Instance);

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

        var result = await CreateHandler().Handle(new ProcessVnPayIpnCommand(BuildSuccessIpn(tx)), CancellationToken.None);

        result.RspCode.Should().Be("00");

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

        var result = await CreateHandler().Handle(new ProcessVnPayIpnCommand(BuildSuccessIpn(tx)), CancellationToken.None);

        result.RspCode.Should().Be("00");

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

        var result = await CreateHandler().Handle(new ProcessVnPayIpnCommand(BuildSuccessIpn(tx)), CancellationToken.None);

        result.RspCode.Should().Be("02");
        (await Db.Enrollments.AsNoTracking().AnyAsync(e => e.BookingId == booking.Id)).Should().BeFalse();
        (await Db.Transactions.AsNoTracking().AnyAsync(t => t.BookingId == booking.Id && t.Type == TransactionType.StudentRefund)).Should().BeFalse();
    }

    private sealed class AlwaysValidVnPayService : IVnPayService
    {
        public string CreatePaymentUrl(VnPayPaymentRequest request) => "https://sandbox.test/pay";
        public bool VerifySignature(IReadOnlyDictionary<string, string> parameters, string secureHash) => true;
        public string GetTmnCode() => "TESTTMN";
    }
}
