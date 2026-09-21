using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// GET /api/v1/sessions/{id}: the read scope is the Student or Tutor of the owning
/// enrollment (plus Admin). This is deliberately an HTTP-level test — it pins the route
/// template, the [Authorize] gate, the ApiResponse envelope and the ForbiddenException →
/// 403 mapping, none of which a MediatR-only dispatch would exercise.
/// </summary>
public class SessionReadAccessTests : IntegrationTestBase
{
    public SessionReadAccessTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task GetSessionById_OverHttp_AllowsOwningStudentAndForbidsUnrelatedUser()
    {
        // Arrange: a paid booking with an activated enrollment allocates the sessions.
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);

        SetCurrentUser(studentUser.Id, UserRole.Student);
        var bookingDto = await SendAsync(new CreateBookingCommand(service.Id));

        var booking = await Db.Bookings
            .Include(b => b.StudentProfile)
            .Include(b => b.TutorProfile)
            .FirstAsync(b => b.Id == bookingDto.Id);

        var activation = Scope.ServiceProvider.GetRequiredService<IEnrollmentActivationService>();
        await activation.ActivateAsync(booking, DateTime.UtcNow, CancellationToken.None);
        booking.Status = BookingStatus.Paid;
        await Db.SaveChangesAsync();

        var session = await Db.Sessions.AsNoTracking()
            .FirstAsync(s => s.Enrollment.BookingId == booking.Id && s.SessionNumber == 1);

        // An authenticated student with no link to that enrollment.
        var stranger = new User
        {
            Id = Guid.NewGuid(),
            Email = $"stranger.{Guid.NewGuid():N}@test.local",
            PasswordHash = "TEST-HASH",
            FullName = "Unrelated Student",
            Role = UserRole.Student,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        Db.Users.Add(stranger);
        await Db.SaveChangesAsync();

        using var client = Factory.CreateClient();

        // Act 1: the owning student.
        SetCurrentUser(studentUser.Id, UserRole.Student);
        using var ownerRequest = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/sessions/{session.Id}");
        ownerRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", IssueAccessToken(studentUser));
        using var ownerResponse = await client.SendAsync(ownerRequest);

        // Assert 1: the full session is returned in the standard envelope.
        ownerResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        using (var document = JsonDocument.Parse(await ownerResponse.Content.ReadAsStringAsync()))
        {
            document.RootElement.GetProperty("success").GetBoolean().Should().BeTrue();
            var data = document.RootElement.GetProperty("data");
            data.GetProperty("id").GetGuid().Should().Be(session.Id);
            data.GetProperty("enrollmentId").GetGuid().Should().Be(session.EnrollmentId);
            data.GetProperty("sessionNumber").GetInt32().Should().Be(1);
            data.GetProperty("status").GetString().Should().Be(nameof(SessionStatus.Unscheduled));
            data.GetProperty("attendanceVerificationDueAt").ValueKind.Should().Be(JsonValueKind.Null);
        }

        // Act 2: an unrelated authenticated user.
        SetCurrentUser(stranger.Id, UserRole.Student);
        using var strangerRequest = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/sessions/{session.Id}");
        strangerRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", IssueAccessToken(stranger));
        using var strangerResponse = await client.SendAsync(strangerRequest);

        // Assert 2: rejected, not merely hidden behind a 404.
        strangerResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        using var forbidden = JsonDocument.Parse(await strangerResponse.Content.ReadAsStringAsync());
        forbidden.RootElement.GetProperty("success").GetBoolean().Should().BeFalse();
    }

    private string IssueAccessToken(User user)
    {
        using var scope = Factory.Services.CreateScope();
        return scope.ServiceProvider.GetRequiredService<IJwtService>().GenerateAccessToken(user);
    }
}
