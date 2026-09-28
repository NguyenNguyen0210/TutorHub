using FluentAssertions;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.Authentication.External;

namespace TutorHub.Infrastructure.UnitTests.Authentication;

/// <summary>
/// WP1: the distributed state store must behave exactly like
/// <see cref="MemoryExternalAuthStateStore"/> (single-use, provider-bound,
/// fail-closed) while sharing entries across nodes via Redis.
/// </summary>
public class DistributedExternalAuthStateStoreTests
{
    private static DistributedExternalAuthStateStore CreateStore(
        FakeRedisStringCommands? redis = null,
        int stateLifetimeMinutes = 10)
    {
        redis ??= new FakeRedisStringCommands();
        var options = Options.Create(new ExternalAuthOptions { StateLifetimeMinutes = stateLifetimeMinutes });
        return new DistributedExternalAuthStateStore(redis, options);
    }

    [Fact]
    public void Create_ThenConsume_ReturnsEntry()
    {
        var store = CreateStore();

        var state = store.Create(ExternalAuthProvider.Google, "verifier-abc", "https://app/cb");

        var entry = store.Consume(state, ExternalAuthProvider.Google);

        entry.Should().Be(new PendingExternalAuth(ExternalAuthProvider.Google, "verifier-abc", "https://app/cb"));
    }

    [Fact]
    public void Consume_TwiceWithSameState_SecondReturnsNull()
    {
        var store = CreateStore();
        var state = store.Create(ExternalAuthProvider.Google, "verifier-abc", null);

        store.Consume(state, ExternalAuthProvider.Google).Should().NotBeNull();

        store.Consume(state, ExternalAuthProvider.Google).Should().BeNull("state is single-use");
    }

    [Fact]
    public void Consume_WithWrongProvider_ReturnsNull()
    {
        var store = CreateStore();
        var state = store.Create(ExternalAuthProvider.Google, "verifier-abc", null);

        store.Consume(state, ExternalAuthProvider.Facebook).Should().BeNull(
            "a state minted for Google must not complete a Facebook sign-in");
    }

    [Fact]
    public void Create_UsesConfiguredStateLifetimeAsExpiry()
    {
        var redis = new FakeRedisStringCommands();
        var store = CreateStore(redis, stateLifetimeMinutes: 10);

        store.Create(ExternalAuthProvider.Google, "verifier-abc", null);

        redis.LastExpiry.Should().Be(TimeSpan.FromMinutes(10));
    }

    [Fact]
    public void Create_WithZeroStateLifetime_ClampsExpiryToOneMinute()
    {
        var redis = new FakeRedisStringCommands();
        var store = CreateStore(redis, stateLifetimeMinutes: 0);

        store.Create(ExternalAuthProvider.Google, "verifier-abc", null);

        redis.LastExpiry.Should().Be(TimeSpan.FromMinutes(1));
    }

    [Fact]
    public void Consume_WithCorruptPayload_ReturnsNull()
    {
        var redis = new FakeRedisStringCommands();
        redis.Seed("bogus-state", "not-json{");
        var store = CreateStore(redis);

        store.Consume("bogus-state", ExternalAuthProvider.Google).Should().BeNull();
    }

    [Fact]
    public void Create_WhenRedisRejectsSets_Throws()
    {
        var redis = new FakeRedisStringCommands { FailSets = true };
        var store = CreateStore(redis);

        Action act = () => store.Create(ExternalAuthProvider.Google, "verifier-abc", null);

        act.Should().Throw<InvalidOperationException>();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Consume_WithBlankState_ReturnsNull(string? state)
    {
        var store = CreateStore();

        store.Consume(state!, ExternalAuthProvider.Google).Should().BeNull();
    }

    /// <summary>
    /// In-memory stand-in for <see cref="IRedisStringCommands"/>:
    /// SET NX keyed by the full Redis key, GETDEL removes on read.
    /// </summary>
    private sealed class FakeRedisStringCommands : IRedisStringCommands
    {
        // Mirrors the store's key format so tests can seed entries directly.
        private const string KeyPrefix = "external-auth:state:";

        private readonly Dictionary<string, string> _values = new(StringComparer.Ordinal);

        public TimeSpan LastExpiry { get; private set; }

        public bool FailSets { get; set; }

        public void Seed(string state, string payload)
        {
            lock (_values)
            {
                _values[KeyPrefix + state] = payload;
            }
        }

        public bool StringSet(string key, string value, TimeSpan expiry, bool whenNotExists, CancellationToken cancellationToken = default)
        {
            lock (_values)
            {
                LastExpiry = expiry;

                if (FailSets)
                {
                    return false;
                }

                if (whenNotExists && _values.ContainsKey(key))
                {
                    return false;
                }

                _values[key] = value;
                return true;
            }
        }

        public string? StringGetDelete(string key, CancellationToken cancellationToken = default)
        {
            lock (_values)
            {
                if (!_values.TryGetValue(key, out var value))
                {
                    return null;
                }

                _values.Remove(key);
                return value;
            }
        }
    }
}
