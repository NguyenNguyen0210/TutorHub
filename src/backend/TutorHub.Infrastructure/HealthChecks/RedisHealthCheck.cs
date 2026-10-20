using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using TutorHub.Infrastructure.Redis;

namespace TutorHub.Infrastructure.HealthChecks;

// WP0: Redis is optional infrastructure, so a dead/unreachable server must never
// fail readiness into a restart loop — it reports Degraded, never Unhealthy.
// The multiplexer is only registered when Redis:Enabled, hence the optional
// constructor parameter (missing service falls back to its default: null).
public sealed class RedisHealthCheck : IHealthCheck
{
    private static readonly TimeSpan PingTimeout = TimeSpan.FromSeconds(2);

    private readonly RedisOptions _options;
    private readonly IConnectionMultiplexer? _multiplexer;

    public RedisHealthCheck(IOptions<RedisOptions> options, IConnectionMultiplexer? multiplexer = null)
    {
        _options = options.Value;
        _multiplexer = multiplexer;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled)
        {
            return HealthCheckResult.Healthy(
                "Redis is disabled.",
                new Dictionary<string, object> { ["redis"] = "disabled" });
        }

        if (_multiplexer is null)
        {
            return HealthCheckResult.Degraded("Redis is enabled but no connection multiplexer is registered.");
        }

        try
        {
            // IDatabase.PingAsync has no CancellationToken overload, so race the
            // ping against a delay instead of awaiting it unbounded.
            var pingTask = _multiplexer.GetDatabase().PingAsync();
            var completed = await Task.WhenAny(pingTask, Task.Delay(PingTimeout, cancellationToken));

            if (completed != pingTask)
            {
                return HealthCheckResult.Degraded("Redis ping timed out after 2s.");
            }

            var latency = await pingTask;
            return HealthCheckResult.Healthy(
                $"Redis ping took {latency.TotalMilliseconds:F1}ms.",
                new Dictionary<string, object> { ["redis"] = "enabled" });
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Degraded($"Redis ping failed: {ex.Message}");
        }
    }
}
