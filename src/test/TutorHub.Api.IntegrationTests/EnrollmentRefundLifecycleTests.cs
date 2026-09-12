using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Enrollments.CancelEnrollment;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Application.Features.Enrollments.TutorCannotContinue;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// H3 regression: enrollment cancellation refunds must be created in the Pending
/// settlement lifecycle (DEC-S8-032 / INV-REFUND-004), never pre-marked Refunded.
/// </summary>
public class EnrollmentRefundLifecycleTests : IntegrationTestBase
{
    public EnrollmentRefundLifecycleTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    private async Task<(Guid StudentUserId, Guid TutorUserId, Guid EnrollmentId)> SetupActiveEnrollmentAsync()
    {
        var (tutorUser, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);

        var dto = await SendAsync(new CreateBookingCommand(studentUser.Id, service.Id));

        var booking = await Db.Bookings
            .Include(b => b.StudentProfile)
            .Include(b => b.TutorProfile)
            .FirstAsync(b => b.Id == dto.Id);

        var activation = Scope.ServiceProvider.GetRequiredService<IEnrollmentActivationService>();
        var enrollment = await activation.ActivateAsync(booking, DateTime.UtcNow, CancellationToken.None);
        booking.Status = BookingStatus.Paid;
        await Db.SaveChangesAsync();

        return (studentUser.Id, tutorUser.Id, enrollment.Id);
    }

    [Fact]
    public async Task StudentCancel_CreatesPendingRefund_NotPreSettled()
    {
        var (studentUserId, _, enrollmentId) = await SetupActiveEnrollmentAsync();

        await SendAsync(new CancelEnrollmentCommand(studentUserId, enrollmentId, "Schedule conflict"));

        var refund = await Db.Transactions.AsNoTracking()
            .FirstAsync(t => t.BookingId == (Db.Enrollments.AsNoTracking()
                .First(e => e.Id == enrollmentId).BookingId)
                && t.Type == TransactionType.StudentRefund);

        refund.Status.Should().Be(TransactionStatus.Pending);
        refund.SettlementRequired.Should().BeTrue();
        refund.RefundedAt.Should().BeNull();
        refund.Amount.Should().Be(900_000m);
    }

    [Fact]
    public async Task TutorCannotContinue_CreatesPendingRefund()
    {
        var (_, tutorUserId, enrollmentId) = await SetupActiveEnrollmentAsync();

        await SendAsync(new TutorCannotContinueCommand(tutorUserId, enrollmentId, "Tutor unavailable"));

        var bookingId = (await Db.Enrollments.AsNoTracking().FirstAsync(e => e.Id == enrollmentId)).BookingId;
        var refund = await Db.Transactions.AsNoTracking()
            .FirstAsync(t => t.BookingId == bookingId && t.Type == TransactionType.StudentRefund);

        refund.Status.Should().Be(TransactionStatus.Pending);
        refund.SettlementRequired.Should().BeTrue();
        refund.RefundedAt.Should().BeNull();
    }
}
