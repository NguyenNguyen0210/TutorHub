using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Disputes.Commands.CreateDispute;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// M9 regression: a dispute is a post-delivery mechanism and must be rejected
/// while the session has not yet taken place (FR-DISPUTE-001, PRD §8.4).
/// </summary>
public class FutureSessionDisputeRejectionTests : IntegrationTestBase
{
    public FutureSessionDisputeRejectionTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    private async Task<(Guid StudentUserId, Session Session)> SetupFutureSessionAsync()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
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
            .Include(s => s.Enrollment)
            .FirstAsync(s => s.EnrollmentId == enrollment.Id && s.SessionNumber == 1);

        // Future session: has not taken place yet.
        session.Schedule(DateTime.UtcNow.AddHours(2), DateTime.UtcNow.AddHours(3));
        await Db.SaveChangesAsync();

        return (studentUser.Id, session);
    }

    [Fact]
    public async Task CreateDispute_OnFutureSession_IsRejected()
    {
        var (studentUserId, session) = await SetupFutureSessionAsync();

        var act = () => SendAsync(new CreateDisputeCommand(
            SessionId: session.Id,
            Reason: DisputeReason.QualityIssue,
            Description: "Filing early before the session has actually taken place."));

        await act.Should().ThrowAsync<BadRequestException>();
    }
}
