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
/// Canonical happy-path VNPay IPN: a Holding booking plus its pre-allocated
/// gateway attempt, then a successful IPN, activates the enrollment with the
/// GROSS escrow amount.
/// </summary>
public class VnPayIpnFlowTests : IntegrationTestBase
{
    public VnPayIpnFlowTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task SuccessIpn_OnHoldingBooking_ActivatesEnrollmentWithGrossEscrow()
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
        await Db.SaveChangesAsync();

        var handler = new ProcessVnPayIpnCommandHandler(
            Db,
            StubIntegrationClock.Instance,
            new AlwaysValidVnPayService(),
            Scope.ServiceProvider.GetRequiredService<IEnrollmentActivationService>(),
            Scope.ServiceProvider.GetRequiredService<IAuditLogService>(),
            NullLogger<ProcessVnPayIpnCommandHandler>.Instance);

        var parameters = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["vnp_TmnCode"] = "TESTTMN",
            ["vnp_CurrCode"] = "VND",
            ["vnp_TxnRef"] = tx.PaymentGatewayRef!,
            ["vnp_ResponseCode"] = "00",
            ["vnp_TransactionStatus"] = "00",
            ["vnp_TransactionNo"] = "555000111",
            ["vnp_Amount"] = (tx.Amount * 100m).ToString(CultureInfo.InvariantCulture),
            ["vnp_SecureHash"] = "dummy"
        };

        var result = await handler.Handle(new ProcessVnPayIpnCommand(parameters), CancellationToken.None);

        result.RspCode.Should().Be("00");

        var freshBooking = await Db.Bookings.AsNoTracking().FirstAsync(b => b.Id == booking.Id);
        freshBooking.Status.Should().Be(BookingStatus.Paid);

        var enrollment = await Db.Enrollments.AsNoTracking()
            .Include(e => e.Sessions)
            .FirstAsync(e => e.BookingId == booking.Id);
        enrollment.Status.Should().Be(EnrollmentStatus.Active);
        enrollment.Sessions.Should().HaveCount(3);

        var wallet = await Db.Wallets.AsNoTracking().FirstAsync(w => w.TutorProfileId == tutor.Id);
        wallet.PendingBalance.Should().Be(900_000m);

        var outboxTypes = await Db.OutboxMessages.AsNoTracking()
            .Where(m => m.AggregateId == booking.Id || m.AggregateId == enrollment.Id)
            .Select(m => m.EventType)
            .ToListAsync();
        outboxTypes.Should().Contain("PaymentSucceeded");
        outboxTypes.Should().Contain("EnrollmentActivated");
    }

    private sealed class AlwaysValidVnPayService : IVnPayService
    {
        public string CreatePaymentUrl(VnPayPaymentRequest request) => "https://sandbox.test/pay";
        public bool VerifySignature(IReadOnlyDictionary<string, string> parameters, string secureHash) => true;
        public string GetTmnCode() => "TESTTMN";
    }
}
