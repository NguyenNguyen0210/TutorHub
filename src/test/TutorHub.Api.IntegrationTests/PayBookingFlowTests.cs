using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Bookings.PayBooking;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// F-30: package checkout on real Postgres — Holding → Pending, Enrollment
/// activation with snapshot, N Unscheduled sessions, escrow Pending credit.
/// </summary>
public class PayBookingFlowTests : IntegrationTestBase
{
    public PayBookingFlowTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task PayBooking_CreatesActiveEnrollment_WithSessions_AndEscrow()
    {
        // Arrange
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);

        var booking = await SendAsync(new CreateBookingCommand(
            UserId: studentUser.Id,
            ServiceId: service.Id));

        // Act
        var paid = await SendAsync(new PayBookingCommand(
            BookingId: booking.Id,
            UserId: studentUser.Id));

        // Assert
        paid.Status.Should().Be(BookingStatus.Paid);

        var enrollment = await Db.Enrollments
            .AsNoTracking()
            .Include(e => e.Sessions)
            .FirstAsync(e => e.BookingId == booking.Id);
        enrollment.Status.Should().Be(EnrollmentStatus.Active);
        enrollment.Sessions.Should().HaveCount(3);
        enrollment.Sessions.Should().OnlyContain(s => s.Status == SessionStatus.Unscheduled);
        enrollment.PlatformFeeRate.Should().BeGreaterThan(0);

        var wallet = await Db.Wallets.AsNoTracking().FirstAsync(w => w.TutorProfileId == tutor.Id);
        wallet.PendingBalance.Should().Be(900_000m);

        var outboxTypes = await Db.OutboxMessages
            .AsNoTracking()
            .Where(m => m.AggregateId == enrollment.Id || m.AggregateId == booking.Id)
            .Select(m => m.EventType)
            .ToListAsync();
        outboxTypes.Should().Contain("PaymentSucceeded");
        outboxTypes.Should().Contain("EnrollmentActivated");
    }
}
