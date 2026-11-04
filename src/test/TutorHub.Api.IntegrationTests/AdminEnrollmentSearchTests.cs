using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Security;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;
public class AdminEnrollmentSearchTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task AdminCanSearchArchivedPackageContracts_WithParticipantAndStatusScope_StudentCannotAccess()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (student, profile, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        student.FullName = "Nguyễn Thảo Vy";
        var booking = new Booking { Id = Guid.NewGuid(), StudentProfileId = profile.Id, TutorProfileId = tutor.Id, ServiceId = service.Id, SubjectId = service.SubjectId, TotalPrice = service.Price, TotalSessions = 3, SessionDurationMinutes = 60, Status = BookingStatus.Paid, CreatedAt = DateTime.UtcNow };
        var contract = new Enrollment { Id = Guid.NewGuid(), BookingId = booking.Id, StudentProfileId = profile.Id, TutorProfileId = tutor.Id, ServiceId = service.Id, SubjectId = service.SubjectId, TotalPrice = service.Price, TotalSessions = 3, SessionDurationMinutes = 60 };
        contract.Activate();
        service.SoftDelete(admin.Id);
        Db.Bookings.Add(booking); Db.Enrollments.Add(contract); await Db.SaveChangesAsync();
        SetCurrentUser(admin.Id, UserRole.Admin);
        using var client = Factory.CreateClient();
        var jwt = Scope.ServiceProvider.GetRequiredService<IJwtService>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt.GenerateAccessToken(admin));
        var url = $"/api/v1/admin/enrollments?search=nguyen%20thao%20vy&participantUserId={student.Id}&status=Active&pageSize=1";
        var response = await client.GetAsync(url); response.StatusCode.Should().Be(HttpStatusCode.OK);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var data = json.RootElement.GetProperty("data");
        data.GetProperty("totalCount").GetInt32().Should().Be(1);
        data.GetProperty("items")[0].GetProperty("id").GetGuid().Should().Be(contract.Id);
        var wrong = await client.GetAsync($"/api/v1/admin/enrollments?search={contract.Id}&status=Cancelled");
        using var empty = JsonDocument.Parse(await wrong.Content.ReadAsStringAsync());
        empty.RootElement.GetProperty("data").GetProperty("totalCount").GetInt32().Should().Be(0);
        SetCurrentUser(student.Id, UserRole.Student);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt.GenerateAccessToken(student));
        (await client.GetAsync(url)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
