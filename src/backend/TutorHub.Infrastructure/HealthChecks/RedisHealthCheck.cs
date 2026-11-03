using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;

namespace TutorHub.Infrastructure.HealthChecks;

// Redis is required: readiness fails when Redis cannot be reached.
public sealed class RedisHealthCheck : IHealthCheck
{
    private static readonly TimeSpan PingTimeout = TimeSpan.FromSeconds(2);

    private readonly IConnectionMultiplexer? _multiplexer;

    public RedisHealthCheck(IConnectionMultiplexer? multiplexer = null)
    {
        _multiplexer = multiplexer;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (_multiplexer is null)
        {
            return HealthCheckResult.Unhealthy("Redis connection multiplexer is missing.");
        }

        try
        {
            // IDatabase.PingAsync has no CancellationToken overload, so race the
            // ping against a delay instead of awaiting it unbounded.
            var pingTask = _multiplexer.GetDatabase().PingAsync();
            var completed = await Task.WhenAny(pingTask, Task.Delay(PingTimeout, cancellationToken));

            if (completed != pingTask)
            {
                return HealthCheckResult.Unhealthy("Redis ping timed out after 2s.");
            }

            var latency = await pingTask;
            return HealthCheckResult.Healthy(
                $"Redis ping took {latency.TotalMilliseconds:F1}ms.",
                new Dictionary<string, object> { ["redis"] = "connected" });
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy($"Redis ping failed: {ex.Message}");
        }
    }
}
