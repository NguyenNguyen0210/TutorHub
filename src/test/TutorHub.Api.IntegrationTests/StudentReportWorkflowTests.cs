using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Bookings.CancelBooking;
using TutorHub.Application.Features.Admin.Reports.ResolveReport;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class StudentReportWorkflowTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task StudentCreatesReport_SeesPersistedResolution_AndOtherUsersCannotAccessIt()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (student, _, service) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        SetCurrentUser(student.Id, UserRole.Student);
        var booking = await SendAsync(new CreateBookingCommand(service.Id));
        using var client = Factory.CreateClient();
        var jwt = Scope.ServiceProvider.GetRequiredService<IJwtService>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt.GenerateAccessToken(student));
        const string description = "Inappropriate conduct while discussing our lessons.";
        var url = $"/api/v1/bookings/{booking.Id}/reports";
        (await client.PostAsJsonAsync(url, new { description })).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        await SendAsync(new CancelBookingCommand(booking.Id, "No longer proceeding with this booking"));
        (await client.PostAsJsonAsync(url, new { description = "short" })).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var response = await client.PostAsJsonAsync(url, new { description });
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        using var created = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var id = created.RootElement.GetProperty("data").GetProperty("id").GetGuid();
        (await client.PostAsJsonAsync(url, new { description })).StatusCode.Should().Be(HttpStatusCode.Conflict);

        SetCurrentUser(admin.Id, UserRole.Admin);
        await SendAsync(new ResolveReportCommand(id, ReportDecision.WarningIssued, "The reported account has received a warning."));
        SetCurrentUser(student.Id, UserRole.Student);
        var history = await client.GetAsync("/api/v1/reports/me");
        history.StatusCode.Should().Be(HttpStatusCode.OK);
        using var json = JsonDocument.Parse(await history.Content.ReadAsStringAsync());
        var item = json.RootElement.GetProperty("data").GetProperty("items").EnumerateArray().Single();
        item.GetProperty("id").GetGuid().Should().Be(id);
        item.GetProperty("description").GetString().Should().Be(description);
        item.GetProperty("status").GetString().Should().Be("Resolved");
        item.GetProperty("resolution").GetString().Should().Contain("received a warning");

        var (_, otherTutor, otherAdmin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (outsider, _, _) = await SeedHelper.SeedMarketplaceAsync(Db, otherTutor, otherAdmin.Id);
        SetCurrentUser(outsider.Id, UserRole.Student);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt.GenerateAccessToken(outsider));
        (await client.PostAsJsonAsync(url, new { description })).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        var privateHistory = await client.GetAsync("/api/v1/reports/me");
        using var privateJson = JsonDocument.Parse(await privateHistory.Content.ReadAsStringAsync());
        privateJson.RootElement.GetProperty("data").GetProperty("items").GetArrayLength().Should().Be(0);
    }
}
