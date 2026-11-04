using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Enrollments.CancelEnrollment;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Application.Features.Enrollments.TutorCannotContinue;
using TutorHub.Application.Features.Enrollments.AdminCancelEnrollment;
using TutorHub.Application.Features.Bookings.DTOs;
using MediatR;
using TutorHub.Domain.Enums;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using TutorHub.Application.Common.Security;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// H3 regression: enrollment cancellation refunds must be created in the Pending
/// settlement lifecycle, never pre-marked Refunded.
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

        return (studentUser.Id, tutorUser.Id, enrollment.Id);
    }

    [Fact]
    public async Task StudentCancel_CreatesPendingRefund_NotPreSettled()
    {
        var (studentUserId, _, enrollmentId) = await SetupActiveEnrollmentAsync();

        SetCurrentUser(studentUserId, UserRole.Student);
        await SendAsync(new CancelEnrollmentCommand(enrollmentId, "Schedule conflict"));

        var refund = await Db.Transactions.AsNoTracking()
            .FirstAsync(t => t.BookingId == (Db.Enrollments.AsNoTracking()
                .First(e => e.Id == enrollmentId).BookingId)
                && t.Type == TransactionType.StudentRefund);

        refund.Status.Should().Be(TransactionStatus.Succeeded);
        refund.SettlementRequired.Should().BeFalse();
        refund.RefundedAt.Should().NotBeNull();
        refund.Amount.Should().Be(900_000m);
    }

    [Fact]
    public async Task TutorCannotContinue_CreatesPendingRefund()
    {
        var (_, tutorUserId, enrollmentId) = await SetupActiveEnrollmentAsync();

        SetCurrentUser(tutorUserId, UserRole.Tutor);
        await SendAsync(new TutorCannotContinueCommand(enrollmentId, "Tutor unavailable"));

        var bookingId = (await Db.Enrollments.AsNoTracking().FirstAsync(e => e.Id == enrollmentId)).BookingId;
        var refund = await Db.Transactions.AsNoTracking()
            .FirstAsync(t => t.BookingId == bookingId && t.Type == TransactionType.StudentRefund);

        refund.Status.Should().Be(TransactionStatus.Succeeded);
        refund.SettlementRequired.Should().BeFalse();
        refund.RefundedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task TutorCannotContinue_ConcurrentRequestsRefundOnlyOnce()
    {
        var (_, tutorUserId, enrollmentId) = await SetupActiveEnrollmentAsync();
        SetCurrentUser(tutorUserId, UserRole.Tutor);
        using var client = Factory.CreateClient();
        var tutorUser = await Db.Users.AsNoTracking().SingleAsync(u => u.Id == tutorUserId);
        var jwt = Scope.ServiceProvider.GetRequiredService<IJwtService>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt.GenerateAccessToken(tutorUser));
        var url = $"/api/v1/enrollments/{enrollmentId}/tutor-cannot-continue";
        var responses = await Task.WhenAll(
            client.PostAsJsonAsync(url, new { reason = "Tutor cannot continue these lessons" }),
            client.PostAsJsonAsync(url, new { reason = "Tutor cannot continue these lessons" }));
        responses.Select(r => r.StatusCode).Should().BeEquivalentTo(new[] { HttpStatusCode.OK, HttpStatusCode.Conflict });
        var enrollment = await Db.Enrollments.AsNoTracking().SingleAsync(e => e.Id == enrollmentId);
        enrollment.Status.Should().Be(EnrollmentStatus.Cancelled);
        var refunds = await Db.Transactions.AsNoTracking().Where(t => t.BookingId == enrollment.BookingId && t.Type == TransactionType.StudentRefund).ToListAsync();
        refunds.Should().ContainSingle().Which.Amount.Should().Be(900_000m);
        (await Db.Wallets.AsNoTracking().SingleAsync(w => w.TutorProfileId == enrollment.TutorProfileId)).PendingBalance.Should().Be(0m);
    }

    [Fact]
    public async Task AdminCancelApi_RefundsOnce_AndRejectsRepeat()
    {
        var (_, _, enrollmentId) = await SetupActiveEnrollmentAsync();
        var admin = await Db.Users.AsNoTracking().FirstAsync(u => u.Role == UserRole.Admin && u.Status == AccountStatus.Active);
        SetCurrentUser(admin.Id, UserRole.Admin);
        using var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Scope.ServiceProvider.GetRequiredService<IJwtService>().GenerateAccessToken(admin));
        var url = $"/api/v1/admin/enrollments/{enrollmentId}/cancel";
        var payload = new { reason = "Administrative decision to stop this enrollment" };
        (await client.PostAsJsonAsync(url, payload)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.PostAsJsonAsync(url, payload)).StatusCode.Should().Be(HttpStatusCode.Conflict);
        var enrollment = await Db.Enrollments.AsNoTracking().SingleAsync(e => e.Id == enrollmentId);
        enrollment.CancelledBy.Should().Be(CancelledBy.Admin);
        (await Db.Transactions.AsNoTracking().CountAsync(t => t.BookingId == enrollment.BookingId && t.Type == TransactionType.StudentRefund)).Should().Be(1);
    }

    [Theory]
    [InlineData(UserRole.Student)]
    [InlineData(UserRole.Tutor)]
    [InlineData(UserRole.Admin)]
    public async Task Cancel_WhenScheduledSessionAlreadyStarted_RejectsWithoutRefund(UserRole actor)
    {
        var (studentUserId, tutorUserId, enrollmentId) = await SetupActiveEnrollmentAsync();
        var now = DateTime.UtcNow;
        var startedSession = await Db.Sessions.FirstAsync(s => s.EnrollmentId == enrollmentId && s.SessionNumber == 1);
        startedSession.Schedule(now.AddHours(-2), now.AddHours(-1));
        await Db.SaveChangesAsync();
        Db.ChangeTracker.Clear();

        var enrollmentBefore = await Db.Enrollments.AsNoTracking().SingleAsync(e => e.Id == enrollmentId);
        var pendingBefore = await Db.Wallets.AsNoTracking()
            .Where(w => w.TutorProfileId == enrollmentBefore.TutorProfileId)
            .Select(w => w.PendingBalance)
            .SingleAsync();

        var actingUserId = actor switch
        {
            UserRole.Student => studentUserId,
            UserRole.Tutor => tutorUserId,
            UserRole.Admin => await Db.Users.AsNoTracking()
                .Where(u => u.Role == UserRole.Admin && u.Status == AccountStatus.Active)
                .Select(u => u.Id).FirstAsync(),
            _ => throw new ArgumentOutOfRangeException(nameof(actor))
        };
        SetCurrentUser(actingUserId, actor);

        IRequest<EnrollmentDto> command = actor switch
        {
            UserRole.Student => new CancelEnrollmentCommand(enrollmentId, "Cancel after session starts"),
            UserRole.Tutor => new TutorCannotContinueCommand(enrollmentId, "Cancel after session starts"),
            UserRole.Admin => new AdminCancelEnrollmentCommand(enrollmentId, "Cancel after session starts"),
            _ => throw new ArgumentOutOfRangeException(nameof(actor))
        };

        Func<Task> act = async () => await SendAsync(command);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Cannot cancel a session that has already started.");

        var enrollmentAfter = await Db.Enrollments.AsNoTracking().SingleAsync(e => e.Id == enrollmentId);
        enrollmentAfter.Status.Should().Be(EnrollmentStatus.Active);
        enrollmentAfter.CancelledAt.Should().BeNull();
        (await Db.Sessions.AsNoTracking().SingleAsync(s => s.Id == startedSession.Id)).Status
            .Should().Be(SessionStatus.Scheduled);
        (await Db.Wallets.AsNoTracking().Where(w => w.TutorProfileId == enrollmentBefore.TutorProfileId)
            .Select(w => w.PendingBalance).SingleAsync()).Should().Be(pendingBefore);
        (await Db.Transactions.AsNoTracking().CountAsync(t => t.BookingId == enrollmentBefore.BookingId
            && t.Type == TransactionType.StudentRefund)).Should().Be(0);
    }
}
