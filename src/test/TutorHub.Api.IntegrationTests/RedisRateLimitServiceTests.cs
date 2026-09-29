using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using TutorHub.Api.RateLimiting;
using TutorHub.Api.Configuration;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// WP3: the distributed fixed-window limiter counts atomically on Redis
/// (Lua INCR+EXPIRE behind <see cref="IRedisRateLimitCommands"/>), keeps the
/// GĐ1 permit budgets per policy, and fails open when Redis is down. The real
/// <see cref="RedisRateLimitService"/> runs over an in-memory
/// <see cref="IRedisRateLimitCommands"/> stand-in so no live Redis is needed —
/// same seam pattern as the OAuth state store and cron lock tests.
/// </summary>
public class RedisRateLimitServiceTests
{
    private static RedisRateLimitService CreateService(
        IRedisRateLimitCommands commands,
        FixedTimeProvider time) =>
        new(commands, time, NullLogger<RedisRateLimitService>.Instance);

    [Fact]
    public async Task OverLimit_ReturnsFalse_WithRetryAfter()
    {
        var start = new DateTimeOffset(2026, 9, 29, 12, 0, 5, TimeSpan.Zero);
        var time = new FixedTimeProvider(start);
        var service = CreateService(new FakeRedisRateLimitCommands(time), time);

        for (var i = 0; i < 10; i++)
        {
            var allowed = await service.CheckAsync(RateLimitingPolicies.AuthStrict, "1.2.3.4");
            allowed.Allowed.Should().BeTrue("attempt {0} is within the auth-strict permit limit", i + 1);
        }

        var rejected = await service.CheckAsync(RateLimitingPolicies.AuthStrict, "1.2.3.4");
        rejected.Allowed.Should().BeFalse("the 11th attempt exceeds the permit limit of 10");
        rejected.RetryAfterSeconds.Should().BeInRange(1, 60);
    }

    [Fact]
    public async Task RetryAfter_EqualsSecondsToWindowEnd()
    {
        // 5s into the minute bucket -> 55s left in the window.
        var time = new FixedTimeProvider(new DateTimeOffset(2026, 9, 29, 12, 0, 5, TimeSpan.Zero));
        var service = CreateService(new FakeRedisRateLimitCommands(time), time);

        var decision = await service.CheckAsync(RateLimitingPolicies.AuthStrict, "1.2.3.4");

        decision.Allowed.Should().BeTrue();
        decision.RetryAfterSeconds.Should().Be(55);
    }

    [Fact]
    public async Task PaymentPolicy_AllowsSixty()
    {
        var time = new FixedTimeProvider(DateTimeOffset.UtcNow);
        var service = CreateService(new FakeRedisRateLimitCommands(time), time);

        for (var i = 0; i < 60; i++)
        {
            (await service.CheckAsync(RateLimitingPolicies.Payment, "1.2.3.4")).Allowed.Should().BeTrue();
        }

        (await service.CheckAsync(RateLimitingPolicies.Payment, "1.2.3.4")).Allowed.Should().BeFalse();
    }

    [Fact]
    public async Task UnknownPolicy_FallsBackToGlobalLimit()
    {
        var time = new FixedTimeProvider(DateTimeOffset.UtcNow);
        var service = CreateService(new FakeRedisRateLimitCommands(time), time);

        for (var i = 0; i < 300; i++)
        {
            (await service.CheckAsync("global", "1.2.3.4")).Allowed.Should().BeTrue();
        }

        var rejected = await service.CheckAsync("global", "1.2.3.4");
        rejected.Allowed.Should().BeFalse("the global budget is 300 per minute");
        rejected.RetryAfterSeconds.Should().BeInRange(1, 60);
    }

    [Fact]
    public async Task DifferentClients_HaveIndependentBudgets()
    {
        var time = new FixedTimeProvider(DateTimeOffset.UtcNow);
        var service = CreateService(new FakeRedisRateLimitCommands(time), time);

        for (var i = 0; i < 10; i++)
        {
            (await service.CheckAsync(RateLimitingPolicies.AuthStrict, "1.2.3.4")).Allowed.Should().BeTrue();
        }

        (await service.CheckAsync(RateLimitingPolicies.AuthStrict, "1.2.3.4")).Allowed.Should().BeFalse();
        (await service.CheckAsync(RateLimitingPolicies.AuthStrict, "5.6.7.8")).Allowed.Should().BeTrue(
            "each client IP gets its own fixed-window bucket");
    }

    [Fact]
    public async Task NewWindow_AllowsAgain()
    {
        var time = new FixedTimeProvider(new DateTimeOffset(2026, 9, 29, 12, 0, 5, TimeSpan.Zero));
        var service = CreateService(new FakeRedisRateLimitCommands(time), time);

        for (var i = 0; i < 10; i++)
        {
            await service.CheckAsync(RateLimitingPolicies.AuthStrict, "1.2.3.4");
        }

        (await service.CheckAsync(RateLimitingPolicies.AuthStrict, "1.2.3.4")).Allowed.Should().BeFalse();

        time.Advance(TimeSpan.FromMinutes(1));

        (await service.CheckAsync(RateLimitingPolicies.AuthStrict, "1.2.3.4")).Allowed.Should().BeTrue(
            "a new minute bucket starts a fresh window");
    }

    [Fact]
    public async Task TwoInstances_SharingOneBackend_AllowExactlyPermitTotal()
    {
        // Cross-node at the store level: two service instances (two API nodes)
        // over one shared backend must admit 10 requests in total, not 10 each.
        var time = new FixedTimeProvider(DateTimeOffset.UtcNow);
        var backend = new FakeRedisRateLimitCommands(time);
        var node1 = CreateService(backend, time);
        var node2 = CreateService(backend, time);

        var allowed = 0;
        for (var i = 0; i < 5; i++)
        {
            if ((await node1.CheckAsync(RateLimitingPolicies.AuthStrict, "1.2.3.4")).Allowed) allowed++;
            if ((await node2.CheckAsync(RateLimitingPolicies.AuthStrict, "1.2.3.4")).Allowed) allowed++;
        }

        allowed.Should().Be(10);
        (await node1.CheckAsync(RateLimitingPolicies.AuthStrict, "1.2.3.4")).Allowed.Should().BeFalse();
        (await node2.CheckAsync(RateLimitingPolicies.AuthStrict, "1.2.3.4")).Allowed.Should().BeFalse();
    }

    [Fact]
    public async Task RedisDown_FailOpen_AllowsRequest()
    {
        var time = new FixedTimeProvider(DateTimeOffset.UtcNow);
        var service = CreateService(new ThrowingRedisRateLimitCommands(), time);

        var decision = await service.CheckAsync(RateLimitingPolicies.AuthStrict, "1.2.3.4");

        decision.Allowed.Should().BeTrue("a dead Redis must never block traffic");
    }

    /// <summary>
    /// In-memory stand-in for <see cref="IRedisRateLimitCommands"/> with the
    /// same fixed-window semantics the Lua script gives on Redis: per-key
    /// counter, expiry set on first increment, expired keys read as missing.
    /// </summary>
    private sealed class FakeRedisRateLimitCommands : IRedisRateLimitCommands
    {
        private readonly Dictionary<string, (long Count, DateTimeOffset ExpiresAt)> _counters = new(StringComparer.Ordinal);
        private readonly TimeProvider _time;

        public FakeRedisRateLimitCommands(TimeProvider time)
        {
            _time = time;
        }

        public Task<long> IncrementWithExpiryAsync(string key, int windowSeconds, CancellationToken cancellationToken = default)
        {
            lock (_counters)
            {
                var now = _time.GetUtcNow();
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

    private sealed class ThrowingRedisRateLimitCommands : IRedisRateLimitCommands
    {
        public Task<long> IncrementWithExpiryAsync(string key, int windowSeconds, CancellationToken cancellationToken = default) =>
            throw new StackExchange.Redis.RedisConnectionException(
                StackExchange.Redis.ConnectionFailureType.UnableToConnect, "redis down");
    }

    private sealed class FixedTimeProvider : TimeProvider
    {
        private DateTimeOffset _now;

        public FixedTimeProvider(DateTimeOffset now)
        {
            _now = now;
        }

        public void Advance(TimeSpan delta) => _now = _now.Add(delta);

        public override DateTimeOffset GetUtcNow() => _now;
    }
}
