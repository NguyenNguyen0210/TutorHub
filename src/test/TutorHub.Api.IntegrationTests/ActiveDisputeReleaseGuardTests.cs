using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Disputes.Commands.CreateDispute;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Application.Features.Sessions.SubmitAttendance;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// H1 regression: while a pre-release dispute is active, matching attendance must
/// NOT complete the session nor release escrow (FR-DISPUTE-003 / INV-003).
/// </summary>
public class ActiveDisputeReleaseGuardTests : IntegrationTestBase
{
    public ActiveDisputeReleaseGuardTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    private async Task<(Guid StudentUserId, Guid TutorUserId, Session Session)> SetupPaidSessionWithActiveDisputeAsync()
    {
        var (tutorUser, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);

        SetCurrentUser(studentUser.Id, UserRole.Student);

        var dto = await SendAsync(new CreateBookingCommand(service.Id));

        var booking = await Db.Bookings
            .Include(b => b.StudentProfile)
            .Include(b => b.TutorProfile)
            .FirstAsync(b => b.Id == dto.Id);

        var activation = Scope.ServiceProvider.GetRequiredService<IEnrollmentActivationService>();
        var enrollment = await activation.ActivateAsync(booking, DateTime.UtcNow, CancellationToken.None);
        booking.Status = BookingStatus.Paid;
        await Db.SaveChangesAsync();

        var session = await Db.Sessions
            .Include(s => s.Enrollment).ThenInclude(e => e.TutorProfile)
            .FirstAsync(s => s.EnrollmentId == enrollment.Id && s.SessionNumber == 1);

        session.Schedule(DateTime.UtcNow.AddHours(-3), DateTime.UtcNow.AddHours(-2));
        await Db.SaveChangesAsync();

        // Pre-release dispute -> EscrowHold + attendance conflict flag.
        await SendAsync(new CreateDisputeCommand(
            SessionId: session.Id,
            InitiatorUserId: studentUser.Id,
            Reason: DisputeReason.TutorNoShow,
            Description: "The tutor did not show up for this scheduled session."));

        return (studentUser.Id, tutorUser.Id, session);
    }

    [Fact]
    public async Task DualAttended_WithActiveDispute_DoesNotReleasePayoutOrComplete()
    {
        var (studentUserId, tutorUserId, session) = await SetupPaidSessionWithActiveDisputeAsync();

        SetCurrentUser(studentUserId, UserRole.Student);
        await SendAsync(new SubmitAttendanceCommand(session.Id, AttendanceStatus.Attended));
        SetCurrentUser(tutorUserId, UserRole.Tutor);
        var result = await SendAsync(new SubmitAttendanceCommand(session.Id, AttendanceStatus.Attended));

        // Session remains unresolved until Admin settles the dispute.
        result.Status.Should().Be(SessionStatus.Scheduled);

        var fresh = await Db.Sessions.AsNoTracking().FirstAsync(s => s.Id == session.Id);
        fresh.Status.Should().Be(SessionStatus.Scheduled);
        fresh.IsPayoutReleased.Should().BeFalse();

        var payoutExists = await Db.Transactions.AsNoTracking()
            .AnyAsync(t => t.SessionId == session.Id && t.Type == TransactionType.SessionPayoutCredit);
        payoutExists.Should().BeFalse();

        var wallet = await Db.Wallets.AsNoTracking()
            .FirstAsync(w => w.TutorProfileId == session.Enrollment.TutorProfileId);
        wallet.PendingBalance.Should().Be(900_000m);
    }
}
