using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Admin.Users.GetAdminUserById;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;
public class AdminServiceReviewTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task AdminCanReviewDraftAndUnpublishWithReason_WithoutChangingContracts_AndSeeTutorOperations()
    {
        var (tutorUser, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (student, profile, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        service.Title = "Gói Toán nâng cao";
        var draft = new Service { Id = Guid.NewGuid(), TutorProfileId = tutor.Id, SubjectId = service.SubjectId, Title = "Draft package", Description = "Private draft content", Price = 100000, TotalSessions = 1, SessionDurationMinutes = 60 };
        Db.Services.Add(draft);
        var booking = new Booking { Id = Guid.NewGuid(), StudentProfileId = profile.Id, TutorProfileId = tutor.Id, ServiceId = service.Id, SubjectId = service.SubjectId, TotalPrice = service.Price, TotalSessions = 3, SessionDurationMinutes = 60, Status = BookingStatus.Paid, CreatedAt = DateTime.UtcNow };
        var enrollment = new Enrollment { Id = Guid.NewGuid(), BookingId = booking.Id, StudentProfileId = profile.Id, TutorProfileId = tutor.Id, ServiceId = service.Id, SubjectId = service.SubjectId, TotalPrice = service.Price, TotalSessions = 3, SessionDurationMinutes = 60 };
        enrollment.Activate(); Db.Bookings.Add(booking); Db.Enrollments.Add(enrollment); await Db.SaveChangesAsync();
        SetCurrentUser(admin.Id, UserRole.Admin);
        var user = await SendAsync(new GetAdminUserByIdQuery(tutorUser.Id));
        user.TutorProfile!.PublishedServices.Should().Be(1); user.TutorProfile.ActiveEnrollments.Should().Be(1);
        user.TutorProfile.ApplicationId.Should().NotBeNull();
        using var client = Factory.CreateClient();
        var jwt = Scope.ServiceProvider.GetRequiredService<IJwtService>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt.GenerateAccessToken(admin));
        (await client.GetAsync($"/api/v1/admin/services/{draft.Id}")).StatusCode.Should().Be(HttpStatusCode.OK);
        var list = await client.GetAsync($"/api/v1/admin/services?search=goi%20toan&tutorUserId={tutorUser.Id}&status=Published&pageSize=1");
        using var json = JsonDocument.Parse(await list.Content.ReadAsStringAsync());
        json.RootElement.GetProperty("data").GetProperty("totalCount").GetInt32().Should().Be(1);
        var action = $"/api/v1/admin/services/{service.Id}/force-unpublish";
        (await client.PostAsJsonAsync(action, new { reason = "" })).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await client.PostAsJsonAsync(action, new { reason = "Verified policy violation in package description" })).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.PostAsJsonAsync(action, new { reason = "Repeated request should not change records" })).StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await Db.Enrollments.AsNoTracking().SingleAsync(e => e.Id == enrollment.Id)).Status.Should().Be(EnrollmentStatus.Active);
        (await Db.AuditLogs.AsNoTracking().SingleAsync(a => a.EntityId == service.Id.ToString() && a.Action == "SERVICE_FORCE_UNPUBLISHED")).NewValuesJson.Should().Contain("Verified policy violation");
        (await client.GetAsync($"/api/v1/admin/services/{service.Id}")).StatusCode.Should().Be(HttpStatusCode.OK);
        SetCurrentUser(student.Id, UserRole.Student);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt.GenerateAccessToken(student));
        (await client.GetAsync($"/api/v1/admin/services/{draft.Id}")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await client.GetAsync("/api/v1/admin/services")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
