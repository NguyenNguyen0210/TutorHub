using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using TutorHub.Api.RateLimiting;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// WP3 enabled-mode: with <c>Redis:Enabled=true</c> plus the RateLimit flag,
/// the pipeline uses <see cref="RedisRateLimitMiddleware"/> instead of the
/// in-memory limiter. The production Redis seam is replaced by an in-memory
/// stand-in, so no live Redis is needed; <c>/health/live</c> runs zero health
/// checks, so no database is needed either. Under the global budget requests
/// pass through, over it they get the exact 429 envelope.
/// </summary>
public class RedisEnabledRateLimitingTests : IDisposable
{
    private readonly RedisRateLimitTestFactory _factory;

    public RedisEnabledRateLimitingTests()
    {
        _factory = new RedisRateLimitTestFactory();
    }

    [Fact]
    public async Task GlobalBudget_ThenThrottledEnvelope()
    {
        using var client = _factory.CreateClient();

        for (var i = 0; i < 300; i++)
        {
            using var allowed = await client.GetAsync("/health/live");
            allowed.StatusCode.Should().Be(HttpStatusCode.OK,
                "attempt {0} is within the global permit limit and must pass through", i + 1);
        }

        using var throttled = await client.GetAsync("/health/live");

        throttled.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
        throttled.Headers.RetryAfter.Should().NotBeNull();

        var body = await throttled.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(body);
        document.RootElement.GetProperty("success").GetBoolean().Should().BeFalse();
        document.RootElement.GetProperty("message").GetString().Should().Contain("Too many requests");
    }

    public void Dispose()
    {
        _factory.Dispose();
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Full app with the Redis rate limiter switched on but every other Redis
    /// feature off (nothing here needs OAuth/cache/backplane/cron), and the
    /// Lua seam replaced by an in-memory counter. Background jobs are removed
    /// for determinism, like the shared integration factory.
    /// </summary>
    private sealed class RedisRateLimitTestFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Redis:Enabled"] = "true",
                    ["Redis:ConnectionString"] = "localhost:6379",
                    ["Redis:Features:RateLimit"] = "true",
                    ["Redis:Features:OAuth"] = "false",
                    ["Redis:Features:SignalR"] = "false",
                    ["Redis:Features:Cache"] = "false",
                    ["Redis:Features:CronLock"] = "false",

                    // Test-only dummy secrets: this sandbox sets no real secret
                    // env vars (CI/dev machines do), and the app refuses to boot
                    // without them (ValidateOnStart). Values are random-looking
                    // and contain no StartupSecretGuard placeholder fragment;
                    // they never leave the test process.
                    ["Jwt:Secret"] = "9f2c4a6e8b1d3f5a7c9e2b4d6f8a1c3e5d7f9a1b3d5f7a9c2e4b6d8f0a2c4e6",
                    ["RefreshToken:Pepper"] = "1a3c5e7b9d2f4a6c8e0b3d5f7a9c1e3b5d7f9a2c4e6b8d0f2a4c6e8b0d2f4a6c8",
                    ["VnPay:TmnCode"] = "TESTTMN1",
                    ["VnPay:HashSecret"] = "2b4d6f8a1c3e5d7f9a1b3d5f7a9c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4a6",
                    ["CloudflareR2:AccountId"] = "test-account-id",
                    ["CloudflareR2:AccessKeyId"] = "test-access-key-id",
                    ["CloudflareR2:SecretAccessKey"] = "3d5f7a9c1e3b5d7f9a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b3d5f7a9c1e3b5d"
                });
            });

            builder.ConfigureServices(services =>
            {
                var hosted = services
                    .Where(d => d.ServiceType == typeof(IHostedService))
                    .ToList();
                foreach (var descriptor in hosted)
                {
                    services.Remove(descriptor);
                }

                var seams = services
                    .Where(d => d.ServiceType == typeof(IRedisRateLimitCommands))
                    .ToList();
                foreach (var descriptor in seams)
                {
                    services.Remove(descriptor);
                }

                services.AddSingleton<IRedisRateLimitCommands, InMemoryRedisRateLimitCommands>();
            });
        }
    }

    /// <summary>
    /// In-memory stand-in with the same fixed-window semantics the Lua script
    /// gives on Redis: per-key counter, expiry set on first increment.
    /// </summary>
    private sealed class InMemoryRedisRateLimitCommands : IRedisRateLimitCommands
    {
        private readonly Dictionary<string, (long Count, DateTimeOffset ExpiresAt)> _counters = new(StringComparer.Ordinal);

        public Task<long> IncrementWithExpiryAsync(string key, int windowSeconds, CancellationToken cancellationToken = default)
        {
            lock (_counters)
            {
                var now = DateTimeOffset.UtcNow;
                if (_counters.TryGetValue(key, out var existing) && existing.ExpiresAt <= now)
                {
                    _counters.Remove(key);
                }

                if (!_counters.TryGetValue(key, out var current))
                {
                    _counters[key] = (1, now.AddSeconds(windowSeconds));
                    return Task.FromResult(1L);
                }

                current.Count++;
                _counters[key] = current;
                return Task.FromResult(current.Count);
            }
        }
    }
}
