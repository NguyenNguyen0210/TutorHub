using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Payments.InitiatePayment;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// P0 dev-tooling: the simulator must be a faithful stand-in for a live VNPay IPN.
///
/// VNPay calls the IPN from its own servers, so a local machine can never complete a
/// checkout; the simulator exists to close that gap for frontend work. These tests pin
/// that it goes through the production webhook handler — escrow funded, enrollment
/// activated, sessions allocated, idempotent on repeat — instead of faking outcomes.
/// </summary>
public class DevPaymentSimulatorTests : IntegrationTestBase
{
    private const string SimulateIpnRoute = "/api/v1/dev/payments/simulate-ipn";

    public DevPaymentSimulatorTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task SimulateIpn_OnHoldingBooking_ActivatesTheEnrollment()
    {
        // Arrange: a real holding booking plus the gateway attempt create-url would mint.
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);

        SetCurrentUser(studentUser.Id, UserRole.Student);
        var booking = await SendAsync(new CreateBookingCommand(service.Id));
        await SendAsync(new InitiatePaymentCommand(booking.Id, "127.0.0.1"));

        // Act
        using var client = Factory.CreateClient();
        using var response = await client.PostAsJsonAsync(
            SimulateIpnRoute,
            new { bookingId = booking.Id, success = true });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        document.RootElement.GetProperty("success").GetBoolean().Should().BeTrue();

        var data = document.RootElement.GetProperty("data");
        data.GetProperty("ackCode").GetString().Should().Be("00");
        data.GetProperty("bookingStatus").GetString().Should().Be("Paid");
        data.GetProperty("enrollmentId").ValueKind.Should().NotBe(JsonValueKind.Null);

        var enrollment = await Db.Enrollments.AsNoTracking()
            .Include(e => e.Sessions)
            .FirstAsync(e => e.BookingId == booking.Id);
        enrollment.Status.Should().Be(EnrollmentStatus.Active);
        enrollment.Sessions.Should().HaveCount(3);

        var wallet = await Db.Wallets.AsNoTracking().FirstAsync(w => w.TutorProfileId == tutor.Id);
        wallet.PendingBalance.Should().Be(900_000m, "the callback funds gross escrow exactly like a live IPN");
    }

    [Fact]
    public async Task SimulateIpn_RunTwice_IsIdempotent()
    {
        // Arrange
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);

        SetCurrentUser(studentUser.Id, UserRole.Student);
        var booking = await SendAsync(new CreateBookingCommand(service.Id));
        await SendAsync(new InitiatePaymentCommand(booking.Id, "127.0.0.1"));

        using var client = Factory.CreateClient();

        // Act
        using var first = await client.PostAsJsonAsync(SimulateIpnRoute, new { bookingId = booking.Id, success = true });
        using var second = await client.PostAsJsonAsync(SimulateIpnRoute, new { bookingId = booking.Id, success = true });

        // Assert: the replay is acknowledged as a duplicate and activates nothing twice.
        using var document = JsonDocument.Parse(await second.Content.ReadAsStringAsync());
        document.RootElement.GetProperty("data").GetProperty("ackCode").GetString().Should().Be("02");

        var enrollments = await Db.Enrollments.AsNoTracking().CountAsync(e => e.BookingId == booking.Id);
        enrollments.Should().Be(1);

        var wallet = await Db.Wallets.AsNoTracking().FirstAsync(w => w.TutorProfileId == tutor.Id);
        wallet.PendingBalance.Should().Be(900_000m, "escrow must not be funded twice");
    }

    [Fact]
    public async Task SimulateIpn_WhenDeclined_LeavesTheBookingHolding()
    {
        // Arrange
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);

        SetCurrentUser(studentUser.Id, UserRole.Student);
        var booking = await SendAsync(new CreateBookingCommand(service.Id));
        await SendAsync(new InitiatePaymentCommand(booking.Id, "127.0.0.1"));

        // Act
        using var client = Factory.CreateClient();
        using var response = await client.PostAsJsonAsync(
            SimulateIpnRoute,
            new { bookingId = booking.Id, success = false });

        // Assert: the callback is acknowledged ("00" means received, not paid) and the
        // 15-minute hold is left to expire on its own.
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var data = document.RootElement.GetProperty("data");
        data.GetProperty("ackCode").GetString().Should().Be("00");
        data.GetProperty("bookingStatus").GetString().Should().Be("Holding");
        data.GetProperty("enrollmentId").ValueKind.Should().Be(JsonValueKind.Null);

        var activated = await Db.Enrollments.AsNoTracking().AnyAsync(e => e.BookingId == booking.Id);
        activated.Should().BeFalse();
    }
}
