using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Logging.Abstractions;
using TutorHub.Api.Configuration;
using TutorHub.Api.RateLimiting;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// WP3: the Redis middleware resolves the policy from endpoint metadata
/// (missing attribute means the global budget), passes allowed requests
/// through, and rejects over-limit ones with the exact 429 envelope the
/// in-memory limiter returns. Runs on <see cref="DefaultHttpContext"/> so no
/// server, database, or live Redis is needed.
/// </summary>
public class RedisRateLimitMiddlewareTests
{
    private static readonly DateTimeOffset FixedNow =
        new(2026, 9, 29, 12, 0, 5, TimeSpan.Zero);

    [Fact]
    public async Task UnderLimit_InvokesNext()
    {
        var service = CreateService();
        var context = NewContext(RateLimitingPolicies.AuthStrict);
        var nextCalled = false;

        await InvokeAsync(service, context, () => nextCalled = true);

        nextCalled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    [Fact]
    public async Task OverLimit_Returns429_WithEnvelopeAndRetryAfter()
    {
        var service = CreateService();

        for (var i = 0; i < 10; i++)
        {
            await InvokeAsync(service, NewContext(RateLimitingPolicies.AuthStrict), () => { });
        }

        var context = NewContext(RateLimitingPolicies.AuthStrict);
        var nextCalled = false;
        await InvokeAsync(service, context, () => nextCalled = true);

        nextCalled.Should().BeFalse("an over-limit request must not reach the handler");
        context.Response.StatusCode.Should().Be(StatusCodes.Status429TooManyRequests);

        var retryAfter = context.Response.Headers.RetryAfter.ToString();
        retryAfter.Should().NotBeNullOrEmpty();
        int.Parse(retryAfter!).Should().BeInRange(1, 60);

        context.Response.ContentType.Should().Be("application/json");
        using var document = JsonDocument.Parse(ReadBody(context));
        document.RootElement.GetProperty("success").GetBoolean().Should().BeFalse();
        document.RootElement.GetProperty("message").GetString().Should()
            .Be("Too many requests. Please retry later.");
    }

    [Fact]
    public async Task NoAttribute_UsesGlobalBudget()
    {
        // Pre-spend the whole global budget for this client, then prove a
        // request to an endpoint WITHOUT the attribute is rejected: it must
        // have counted against the global policy, not auth-strict.
        var service = CreateService();
        for (var i = 0; i < 300; i++)
        {
            await service.CheckAsync(RedisRateLimitService.GlobalPolicyName, "unknown");
        }

        var context = NewContext(policy: null);
        var nextCalled = false;
        await InvokeAsync(service, context, () => nextCalled = true);

        nextCalled.Should().BeFalse();
        context.Response.StatusCode.Should().Be(StatusCodes.Status429TooManyRequests);
    }

    [Fact]
    public async Task NullEndpoint_UsesGlobalBudgetWithoutCrashing()
    {
        var service = CreateService();
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        var nextCalled = false;

        await InvokeAsync(service, context, () => nextCalled = true);

        nextCalled.Should().BeTrue("a fresh global bucket must allow the request");
    }

    [Fact]
    public async Task RedisDown_FailOpen_CallsNext()
    {
        var service = new RedisRateLimitService(
            new ThrowingCommands(),
            new FixedTimeProvider(FixedNow),
            NullLogger<RedisRateLimitService>.Instance);
        var context = NewContext(RateLimitingPolicies.AuthStrict);
        var nextCalled = false;

        await InvokeAsync(service, context, () => nextCalled = true);

        nextCalled.Should().BeTrue("a dead Redis must never block traffic");
    }

    private static Task InvokeAsync(RedisRateLimitService service, HttpContext context, Action onNext)
    {
        var middleware = new RedisRateLimitMiddleware(
            _ =>
            {
                onNext();
                return Task.CompletedTask;
            },
            service);
        return middleware.InvokeAsync(context);
    }

    private static RedisRateLimitService CreateService()
    {
        var time = new FixedTimeProvider(FixedNow);
        return new RedisRateLimitService(
            new InMemoryRateLimitCommands(time),
            time,
            NullLogger<RedisRateLimitService>.Instance);
    }

    private static HttpContext NewContext(string? policy)
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        var metadata = policy is null
            ? new EndpointMetadataCollection()
            : new EndpointMetadataCollection(new EnableRateLimitingAttribute(policy));
        context.SetEndpoint(new Endpoint(_ => Task.CompletedTask, metadata, "test"));
        return context;
    }

    private static string ReadBody(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        return reader.ReadToEnd();
    }

    private sealed class FixedTimeProvider : TimeProvider
    {
        private readonly DateTimeOffset _now;

        public FixedTimeProvider(DateTimeOffset now)
        {
            _now = now;
        }

        public override DateTimeOffset GetUtcNow() => _now;
    }

    private sealed class InMemoryRateLimitCommands : IRedisRateLimitCommands
    {
        private readonly Dictionary<string, (long Count, DateTimeOffset ExpiresAt)> _counters = new(StringComparer.Ordinal);
        private readonly TimeProvider _time;

        public InMemoryRateLimitCommands(TimeProvider time)
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

    private sealed class ThrowingCommands : IRedisRateLimitCommands
    {
        public Task<long> IncrementWithExpiryAsync(string key, int windowSeconds, CancellationToken cancellationToken = default) =>
            throw new StackExchange.Redis.RedisConnectionException(
                StackExchange.Redis.ConnectionFailureType.UnableToConnect, "redis down");
    }
}
