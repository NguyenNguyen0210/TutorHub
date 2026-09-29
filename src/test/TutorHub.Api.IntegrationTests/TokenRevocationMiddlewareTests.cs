using System.Security.Claims;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TutorHub.Api.Middlewares;
using TutorHub.Infrastructure.Redis;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// WP6: per-user JWT revocation. The pure version compare plus the middleware
/// (401 envelope on a stale or missing version, fail-closed when Redis is
/// down) run on <see cref="DefaultHttpContext"/> with hand-written fakes, so
/// no Postgres, Redis, or Docker is needed.
/// </summary>
public class TokenRevocationMiddlewareTests
{
    [Theory]
    [InlineData(0, 0, false)]
    [InlineData(1, 1, false)]
    // A token newer than a stale cache entry is still valid (cache lags the DB).
    [InlineData(2, 1, false)]
    [InlineData(0, 1, true)]
    [InlineData(1, 3, true)]
    public void IsRevoked_OnlyOlderTokenIsRevoked(int tokenVer, int cachedVer, bool expected)
    {
        TokenVersionValidator.IsRevoked(tokenVer, cachedVer).Should().Be(expected);
    }

    [Fact]
    public async Task MatchingVersion_CallsNext_WithoutTouchingDatabase()
    {
        var userId = Guid.NewGuid();
        var cache = new FakeDistributedCache();
        cache.SetString(TokenVersionCacheKey(userId), "1");
        var reader = new StubTokenVersionReader(1);
        var context = NewContext(userId, ver: "1", cache: cache, reader: reader);
        var nextCalled = false;

        await CreateMiddleware(() => nextCalled = true).InvokeAsync(context);

        nextCalled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
        reader.Calls.Should().Be(0, "a cache hit must not hit the database");
    }

    [Fact]
    public async Task CacheMiss_LoadsFromDatabase_AllowsWhenEqual_AndFillsCache()
    {
        var userId = Guid.NewGuid();
        var cache = new FakeDistributedCache();
        var reader = new StubTokenVersionReader(2);
        var context = NewContext(userId, ver: "2", cache: cache, reader: reader);
        var nextCalled = false;

        await CreateMiddleware(() => nextCalled = true).InvokeAsync(context);

        nextCalled.Should().BeTrue();
        reader.Calls.Should().Be(1);
        cache.GetString(TokenVersionCacheKey(userId)).Should().Be("2");
    }

    [Fact]
    public async Task StaleToken_Returns401_WithRevokedEnvelope()
    {
        var userId = Guid.NewGuid();
        var cache = new FakeDistributedCache();
        cache.SetString(TokenVersionCacheKey(userId), "3");
        var context = NewContext(userId, ver: "1", cache: cache, reader: new StubTokenVersionReader(3));
        var nextCalled = false;

        await CreateMiddleware(() => nextCalled = true).InvokeAsync(context);

        nextCalled.Should().BeFalse("a revoked token must not reach the handler");
        var envelope = ReadEnvelope(context);
        envelope.Status.Should().Be(StatusCodes.Status401Unauthorized);
        envelope.Success.Should().BeFalse();
        envelope.Message.Should().Be("Session has been revoked. Please sign in again.");
    }

    [Fact]
    public async Task MissingVerClaim_Returns401()
    {
        var context = NewContext(Guid.NewGuid(), ver: null, cache: new FakeDistributedCache(), reader: new StubTokenVersionReader(0));
        var nextCalled = false;

        await CreateMiddleware(() => nextCalled = true).InvokeAsync(context);

        nextCalled.Should().BeFalse();
        var envelope = ReadEnvelope(context);
        envelope.Status.Should().Be(StatusCodes.Status401Unauthorized);
        envelope.Message.Should().Be("Token version missing.");
    }

    [Fact]
    public async Task RedisDown_Returns401_WithUnavailableEnvelope_FailClosed()
    {
        var context = NewContext(Guid.NewGuid(), ver: "0", cache: new ThrowingDistributedCache(), reader: new StubTokenVersionReader(0));
        var nextCalled = false;

        await CreateMiddleware(() => nextCalled = true).InvokeAsync(context);

        nextCalled.Should().BeFalse("a dead Redis must never let an auth request through");
        var envelope = ReadEnvelope(context);
        envelope.Status.Should().Be(StatusCodes.Status401Unauthorized);
        envelope.Message.Should().Be("Authentication service unavailable.");
    }

    [Fact]
    public async Task UnauthenticatedRequest_SkipsCheck()
    {
        var context = NewContext(Guid.NewGuid(), ver: null, authenticated: false, cache: new ThrowingDistributedCache(), reader: new StubTokenVersionReader(null));
        var nextCalled = false;

        await CreateMiddleware(() => nextCalled = true).InvokeAsync(context);

        nextCalled.Should().BeTrue("anonymous requests (login, health) must not pay for a revocation check");
    }

    [Fact]
    public async Task RevokeCheckDisabled_SkipsCheck_FallsBackToOldBehavior()
    {
        var userId = Guid.NewGuid();
        var cache = new FakeDistributedCache();
        cache.SetString(TokenVersionCacheKey(userId), "5");
        var context = NewContext(userId, ver: "0", cache: cache, reader: new StubTokenVersionReader(5));
        var nextCalled = false;

        await CreateMiddleware(() => nextCalled = true, revokeCheck: false).InvokeAsync(context);

        nextCalled.Should().BeTrue("flag off must behave exactly like the pre-Redis code");
    }

    [Fact]
    public async Task CacheMiss_UserDeleted_Returns401Revoked()
    {
        var context = NewContext(Guid.NewGuid(), ver: "0", cache: new FakeDistributedCache(), reader: new StubTokenVersionReader(null));
        var nextCalled = false;

        await CreateMiddleware(() => nextCalled = true).InvokeAsync(context);

        nextCalled.Should().BeFalse();
        ReadEnvelope(context).Message.Should().Be("Session has been revoked. Please sign in again.");
    }

    private static string TokenVersionCacheKey(Guid userId) => $"auth:ver:{userId}";

    private static TokenRevocationMiddleware CreateMiddleware(Action onNext, bool enabled = true, bool revokeCheck = true)
    {
        RequestDelegate next = _ =>
        {
            onNext();
            return Task.CompletedTask;
        };
        var options = Options.Create(new RedisOptions
        {
            Enabled = enabled,
            Features = new RedisFeatureFlags { RevokeCheck = revokeCheck }
        });
        return new TokenRevocationMiddleware(next, options, NullLogger<TokenRevocationMiddleware>.Instance);
    }

    private static DefaultHttpContext NewContext(
        Guid userId,
        string? ver,
        bool authenticated = true,
        IDistributedCache? cache = null,
        ITokenVersionReader? reader = null)
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        if (authenticated)
        {
            var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, userId.ToString()) };
            if (ver is not null)
            {
                claims.Add(new Claim("ver", ver));
            }

            context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"));
        }

        var services = new ServiceCollection();
        if (cache is not null)
        {
            services.AddSingleton(cache);
        }

        if (reader is not null)
        {
            services.AddSingleton(reader);
        }

        context.RequestServices = services.BuildServiceProvider();
        return context;
    }

    private static (int Status, bool Success, string Message) ReadEnvelope(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        using var document = JsonDocument.Parse(reader.ReadToEnd());
        return (
            context.Response.StatusCode,
            document.RootElement.GetProperty("success").GetBoolean(),
            document.RootElement.GetProperty("message").GetString()!);
    }

    private sealed class FakeDistributedCache : IDistributedCache
    {
        private readonly Dictionary<string, byte[]> _store = new(StringComparer.Ordinal);

        public byte[]? Get(string key) => _store.TryGetValue(key, out var value) ? value : null;

        public Task<byte[]?> GetAsync(string key, CancellationToken token = default) =>
            Task.FromResult(Get(key));

        public void Refresh(string key)
        {
        }

        public Task RefreshAsync(string key, CancellationToken token = default) =>
            Task.CompletedTask;

        public void Remove(string key) => _store.Remove(key);

        public Task RemoveAsync(string key, CancellationToken token = default)
        {
            Remove(key);
            return Task.CompletedTask;
        }

        public void Set(string key, byte[] value, DistributedCacheEntryOptions options) =>
            _store[key] = value;

        public Task SetAsync(string key, byte[] value, DistributedCacheEntryOptions options, CancellationToken token = default)
        {
            Set(key, value, options);
            return Task.CompletedTask;
        }
    }

    private sealed class ThrowingDistributedCache : IDistributedCache
    {
        private static Exception Down() => new InvalidOperationException("redis down");

        public byte[]? Get(string key) => throw Down();

        public Task<byte[]?> GetAsync(string key, CancellationToken token = default) => throw Down();

        public void Refresh(string key) => throw Down();

        public Task RefreshAsync(string key, CancellationToken token = default) => throw Down();

        public void Remove(string key) => throw Down();

        public Task RemoveAsync(string key, CancellationToken token = default) => throw Down();

        public void Set(string key, byte[] value, DistributedCacheEntryOptions options) => throw Down();

        public Task SetAsync(string key, byte[] value, DistributedCacheEntryOptions options, CancellationToken token = default) => throw Down();
    }

    private sealed class StubTokenVersionReader : ITokenVersionReader
    {
        private readonly int? _version;

        public StubTokenVersionReader(int? version)
        {
            _version = version;
        }

        public int Calls { get; private set; }

        public Task<int?> GetTokenVersionAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            Calls++;
            return Task.FromResult(_version);
        }
    }
}
