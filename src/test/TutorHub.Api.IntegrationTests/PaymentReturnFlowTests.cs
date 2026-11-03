using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Bookings.CancelBooking;
using TutorHub.Application.Features.Bookings.ProcessBookingTimeouts;
using TutorHub.Application.Features.Payments.DTOs;
using TutorHub.Application.Features.Payments.InitiatePayment;
using TutorHub.Application.Features.Enrollments.GetMyEnrollments;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.Services.VnPay;

namespace TutorHub.Api.IntegrationTests;

public class PaymentReturnFlowTests : IntegrationTestBase
{
    public PaymentReturnFlowTests(IntegrationWebApplicationFactory factory) : base(factory) { }

    private async Task<(PaymentRedirectDto Payment, Guid TutorId)> CreateCheckoutAsync()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        SetCurrentUser(studentUser.Id, UserRole.Student);
        var booking = await SendAsync(new CreateBookingCommand(service.Id));
        return (await SendAsync(new InitiatePaymentCommand(booking.Id, "127.0.0.1")), tutor.Id);
    }

    private string SignedReturn(string reference, decimal amount = 900_000m, string responseCode = "00")
    {
        var options = Factory.Services.GetRequiredService<IOptions<VnPayOptions>>().Value;
        var parameters = new VnPayLibrary();
        parameters.AddRequestData("vnp_TmnCode", options.TmnCode);
        parameters.AddRequestData("vnp_TxnRef", reference);
        parameters.AddRequestData("vnp_Amount", (amount * 100m).ToString("0", CultureInfo.InvariantCulture));
        parameters.AddRequestData("vnp_ResponseCode", responseCode);
        parameters.AddRequestData("vnp_TransactionStatus", responseCode);
        parameters.AddRequestData("vnp_TransactionNo", "987654321");
        return parameters.CreateRequestUrl("/api/v1/payments/vnpay/return", options.HashSecret);
    }

    [Fact]
    public async Task DashboardSummary_ReturnsTutorPhotoAndActualReleasedAndRefundedTuition()
    {
        var (payment, tutorId) = await CreateCheckoutAsync();
        var tutor = await Db.TutorProfiles.Include(t => t.User).SingleAsync(t => t.Id == tutorId);
        tutor.User.AvatarUrl = "/test/tutor-photo.png";
        await Db.SaveChangesAsync();
        using var client = Factory.CreateClient();
        await ReadResult(client, SignedReturn(payment.MerchantReference));
        var initial = (await SendAsync(new GetMyEnrollmentsQuery(PageSize: 100))).Items
            .Single(e => e.BookingId == payment.BookingId);
        initial.TutorAvatarUrl.Should().Be("/test/tutor-photo.png");
        initial.TutorUserId.Should().Be(tutor.UserId);
        initial.ReleasedAmount.Should().Be(0);
        initial.RefundedAmount.Should().Be(0);

        Db.ChangeTracker.Clear(); // Payment activation ran in a separate request scope.
        var enrollment = await Db.Enrollments.Include(e => e.Sessions)
            .Include(e => e.StudentProfile).ThenInclude(s => s.User)
            .Include(e => e.TutorProfile).ThenInclude(t => t.User)
            .SingleAsync(e => e.BookingId == payment.BookingId);
        await SeedHelper.CompleteAndReleasePayoutAsync(Db, enrollment.Sessions.First());
        var refund = TutorHub.Domain.Entities.Transaction.CreateRefund(
            payment.BookingId, null, null, null, 200_000m, "TEST-DASHBOARD-REFUND", "Test refund", DateTime.UtcNow);
        refund.Status = TransactionStatus.Succeeded;
        var failed = TutorHub.Domain.Entities.Transaction.CreateRefund(
            payment.BookingId, null, null, null, 100_000m, "TEST-DASHBOARD-FAILED", "Failed refund", DateTime.UtcNow);
        failed.Status = TransactionStatus.Failed;
        Db.Transactions.AddRange(refund, failed);
        await Db.SaveChangesAsync();
        var updated = (await SendAsync(new GetMyEnrollmentsQuery(PageSize: 100))).Items
            .Single(e => e.BookingId == payment.BookingId);
        updated.CompletedSessions.Should().Be(1);
        updated.ReleasedAmount.Should().Be(300_000m);
        updated.RefundedAmount.Should().Be(200_000m);
    }

    private static async Task<JsonElement> ReadResult(HttpClient client, string url)
    {
        using var response = await client.GetAsync(url);
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return json.GetProperty("data");
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task VerifiedReturn_WithoutIpn_ActivatesCourseAndDashboard(bool holdExpired)
    {
        var (payment, tutorId) = await CreateCheckoutAsync();
        if (holdExpired)
        {
            var booking = await Db.Bookings.SingleAsync(b => b.Id == payment.BookingId);
            booking.HoldingExpiresAt = DateTime.UtcNow.AddMinutes(-1);
            await Db.SaveChangesAsync();
            await SendAsync(new ProcessBookingTimeoutsCommand());
        }
        using var client = Factory.CreateClient();
        var url = SignedReturn(payment.MerchantReference);
        var result = await ReadResult(client, url);
        result.GetProperty("success").GetBoolean().Should().BeTrue();
        result.GetProperty("status").GetString().Should().Be("Completed");
        result.GetProperty("bookingId").GetGuid().Should().Be(payment.BookingId);

        var enrollment = await Db.Enrollments.AsNoTracking().Include(e => e.Sessions)
            .SingleAsync(e => e.BookingId == payment.BookingId);
        enrollment.Status.Should().Be(EnrollmentStatus.Active);
        enrollment.Sessions.Should().HaveCount(3);
        (await Db.Bookings.AsNoTracking().SingleAsync(b => b.Id == payment.BookingId))
            .Status.Should().Be(BookingStatus.Paid);

        var dashboardResponse = await SendAsync(new GetMyEnrollmentsQuery(PageSize: 20));
        dashboardResponse.Items.Should().Contain(item => item.BookingId == payment.BookingId);

        // Refreshing the receipt and the subsequent real IPN must not fund escrow twice.
        (await ReadResult(client, url)).GetProperty("success").GetBoolean().Should().BeTrue();
        using var ipn = await client.GetAsync(url.Replace("/vnpay/return?", "/vnpay/ipn?"));
        ipn.EnsureSuccessStatusCode();
        var ack = await ipn.Content.ReadFromJsonAsync<JsonElement>();
        ack.GetProperty("rspCode").GetString().Should().Be("02");
        (await Db.Enrollments.AsNoTracking().CountAsync(e => e.BookingId == payment.BookingId)).Should().Be(1);
        (await Db.Wallets.AsNoTracking().SingleAsync(w => w.TutorProfileId == tutorId))
            .PendingBalance.Should().Be(900_000m);
    }

    [Theory]
    [InlineData("invalid-signature")]
    [InlineData("wrong-amount")]
    [InlineData("declined")]
    [InlineData("unknown-attempt")]
    public async Task UnverifiedOrUnsettledReturn_NeverReportsActivation(string scenario)
    {
        var (payment, tutorId) = await CreateCheckoutAsync();
        var url = SignedReturn(
            scenario == "unknown-attempt" ? "UNKNOWN-REFERENCE" : payment.MerchantReference,
            scenario == "wrong-amount" ? 1m : 900_000m,
            scenario == "declined" ? "24" : "00");
        if (scenario == "invalid-signature") url += "corrupted";
        using var client = Factory.CreateClient();
        var result = await ReadResult(client, url);
        result.GetProperty("success").GetBoolean().Should().BeFalse();
        (await Db.Enrollments.AsNoTracking().AnyAsync(e => e.BookingId == payment.BookingId)).Should().BeFalse();
        (await Db.Wallets.AsNoTracking().SingleAsync(w => w.TutorProfileId == tutorId))
            .PendingBalance.Should().Be(0m);
    }

    [Fact]
    public async Task ReturnAfterStudentCancellation_ReportsRefundInsteadOfCourseSuccess()
    {
        var (payment, _) = await CreateCheckoutAsync();
        await SendAsync(new CancelBookingCommand(payment.BookingId, "Changed plans"));
        using var client = Factory.CreateClient();
        var result = await ReadResult(client, SignedReturn(payment.MerchantReference));
        result.GetProperty("success").GetBoolean().Should().BeFalse();
        result.GetProperty("status").GetString().Should().Be("RefundPending");
        (await Db.Enrollments.AsNoTracking().AnyAsync(e => e.BookingId == payment.BookingId)).Should().BeFalse();
        (await Db.Transactions.AsNoTracking().CountAsync(t => t.BookingId == payment.BookingId &&
            t.Type == TransactionType.StudentRefund && t.SettlementRequired)).Should().Be(1);
    }
}
