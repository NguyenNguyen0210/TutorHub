using System.Net;
using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// P0-E3: /health is the readiness probe docker-compose already uses, so it must
/// report every dependency the instance needs to serve traffic, and /health/live
/// must stay free of dependency checks so a database outage cannot make an
/// orchestrator restart a healthy process.
/// </summary>
public class HealthEndpointTests : IntegrationTestBase
{
    public HealthEndpointTests(IntegrationWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task Readiness_ReportsDatabaseAndPlatformFeeSetting()
    {
        using var client = Factory.CreateClient();

        using var response = await client.GetAsync("/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        document.RootElement.GetProperty("status").GetString().Should().Be("Healthy");

        var checks = document.RootElement.GetProperty("checks");
        checks.TryGetProperty("database", out var database).Should().BeTrue();
        database.GetProperty("status").GetString().Should().Be("Healthy");

        checks.TryGetProperty("platform-fee-setting", out var feeSetting).Should().BeTrue();
        feeSetting.GetProperty("status").GetString().Should().Be("Healthy");
    }

    [Fact]
    public async Task Liveness_RunsNoDependencyChecks()
    {
        using var client = Factory.CreateClient();

        using var response = await client.GetAsync("/health/live");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        document.RootElement.GetProperty("status").GetString().Should().Be("Healthy");
        document.RootElement.GetProperty("checks").EnumerateObject().Should().BeEmpty();
    }
}
