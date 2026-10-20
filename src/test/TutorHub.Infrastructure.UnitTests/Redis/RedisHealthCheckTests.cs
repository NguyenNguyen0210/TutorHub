using FluentAssertions;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using TutorHub.Infrastructure.HealthChecks;
using TutorHub.Infrastructure.Redis;

namespace TutorHub.Infrastructure.UnitTests.Redis;

/// <summary>
/// WP0/WP3: Redis is optional infrastructure, so the health check must never
/// report Unhealthy (which would restart a healthy process). Disabled means
/// Healthy; enabled without a multiplexer (Redis down at boot / DI missing)
/// means Degraded. Both cases need no multiplexer fake.
/// </summary>
public class RedisHealthCheckTests
{
    [Fact]
    public async Task Disabled_ReturnsHealthy()
    {
        var check = new RedisHealthCheck(Options.Create(new RedisOptions { Enabled = false }));

        var result = await check.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Status.Should().NotBe(HealthStatus.Unhealthy);
    }

    [Fact]
    public async Task Enabled_WithoutMultiplexer_ReturnsDegraded_NeverUnhealthy()
    {
        var check = new RedisHealthCheck(
            Options.Create(new RedisOptions { Enabled = true, ConnectionString = "localhost:6379" }));

        var result = await check.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Degraded);
        result.Status.Should().NotBe(HealthStatus.Unhealthy);
    }
}
