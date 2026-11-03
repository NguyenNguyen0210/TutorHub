using System.ComponentModel.DataAnnotations;

namespace TutorHub.Infrastructure.Redis;

// single shared Redis for OAuth state, SignalR backplane, cache and cron
// locks. Redis is required in every environment.
// ConnectionStrings:Redis wins; Redis:ConnectionString is the fallback (see the
// registration in InfrastructureServiceCollectionExtensions).
public sealed class RedisOptions
{
    public const string SectionName = "Redis";

    [MinLength(1)]
    public string ConnectionString { get; set; } = string.Empty;

    public string InstanceName { get; set; } = "tutorhub:";
}
