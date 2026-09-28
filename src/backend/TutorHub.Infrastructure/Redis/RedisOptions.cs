using System.ComponentModel.DataAnnotations;

namespace TutorHub.Infrastructure.Redis;

// WP0: single shared Redis for OAuth state, SignalR backplane, cache and cron
// locks. Disabled by default so the API boots and serves with no redis running.
// ConnectionStrings:Redis wins; Redis:ConnectionString is the fallback (see the
// registration in InfrastructureServiceCollectionExtensions).
public sealed class RedisOptions
{
    public const string SectionName = "Redis";

    public bool Enabled { get; set; }

    [MinLength(1)]
    public string ConnectionString { get; set; } = string.Empty;

    public string InstanceName { get; set; } = "tutorhub:";

    public RedisFeatureFlags Features { get; set; } = new();
}

public sealed class RedisFeatureFlags
{
    public bool OAuth { get; set; } = true;

    public bool SignalR { get; set; } = true;

    public bool Cache { get; set; } = true;

    public bool CronLock { get; set; } = true;
}
