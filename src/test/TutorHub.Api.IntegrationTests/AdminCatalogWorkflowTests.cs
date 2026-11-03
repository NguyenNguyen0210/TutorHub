using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Security;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class AdminCatalogWorkflowTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task AdminCreatesUpdatesDeletesAndRestoresCatalog_WithRelationshipGuards()
    {
        var (_, _, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        SetCurrentUser(admin.Id, UserRole.Admin);
        using var client = Factory.CreateClient();
        var jwt = Scope.ServiceProvider.GetRequiredService<IJwtService>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt.GenerateAccessToken(admin));
        var name = $"Category {Guid.NewGuid():N}";
        var created = await client.PostAsJsonAsync("/api/v1/admin/categories", new { name, description = "Category description" });
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var categoryId = await ReadId(created);
        (await client.PostAsJsonAsync("/api/v1/admin/categories", new { name })).StatusCode.Should().Be(HttpStatusCode.Conflict);
        var subject = await client.PostAsJsonAsync("/api/v1/admin/subjects", new { name = $"Subject {Guid.NewGuid():N}", categoryId });
        subject.StatusCode.Should().Be(HttpStatusCode.Created);
        var subjectId = await ReadId(subject);
        (await client.DeleteAsync($"/api/v1/admin/categories/{categoryId}")).StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await client.PutAsJsonAsync($"/api/v1/admin/subjects/{subjectId}", new { name = "Updated subject", categoryId, isActive = false })).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.DeleteAsync($"/api/v1/admin/subjects/{subjectId}")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.GetAsync("/api/v1/admin/subjects/trash")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.PostAsync($"/api/v1/admin/subjects/{subjectId}/restore", null)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.DeleteAsync($"/api/v1/admin/subjects/{subjectId}")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.DeleteAsync($"/api/v1/admin/categories/{categoryId}")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.PostAsync($"/api/v1/admin/categories/{categoryId}/restore", null)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.PutAsJsonAsync($"/api/v1/admin/categories/{categoryId}", new { name, description = "Updated description", isActive = true })).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private static async Task<Guid> ReadId(HttpResponseMessage response)
    {
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return json.RootElement.GetProperty("data").GetProperty("id").GetGuid();
    }
}
