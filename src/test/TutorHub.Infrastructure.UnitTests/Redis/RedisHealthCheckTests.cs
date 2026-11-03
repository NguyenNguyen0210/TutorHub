using FluentAssertions;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Moq;
using StackExchange.Redis;
using TutorHub.Infrastructure.HealthChecks;

namespace TutorHub.Infrastructure.UnitTests.Redis;

/// <summary>
/// Redis is a required readiness dependency.
/// </summary>
public class RedisHealthCheckTests
{
    [Fact]
    public async Task WithoutMultiplexer_ReturnsUnhealthy()
    {
        var check = new RedisHealthCheck();

        var result = await check.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Unhealthy);
    }

    [Fact]
    public async Task RedisConnectionFailure_ReturnsUnhealthy()
    {
        var multiplexer = new Mock<IConnectionMultiplexer>();
        multiplexer.Setup(m => m.GetDatabase(It.IsAny<int>(), It.IsAny<object>()))
            .Throws(new RedisConnectionException(ConnectionFailureType.UnableToConnect, "Redis unavailable"));
        var check = new RedisHealthCheck(multiplexer.Object);

        var result = await check.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Unhealthy);
    }
}
