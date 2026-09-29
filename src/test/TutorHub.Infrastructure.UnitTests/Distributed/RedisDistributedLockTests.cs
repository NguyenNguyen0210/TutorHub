using FluentAssertions;
using TutorHub.Infrastructure.Distributed;

namespace TutorHub.Infrastructure.UnitTests.Distributed;

/// <summary>
/// WP4: at most one cron node may hold a lock key at a time (mutual
/// exclusion via SET NX PX), a release frees the key for re-acquire, and
/// different keys do not interfere. The real <see cref="RedisDistributedLock"/>
/// runs over an in-memory <see cref="IRedisLockCommands"/> stand-in so no live
/// Redis is needed — same seam pattern as the OAuth state store tests.
/// </summary>
public class RedisDistributedLockTests
{
    private static RedisDistributedLock CreateLock(FakeRedisLockCommands commands) =>
        new(commands);

    [Fact]
    public async Task TwoWorkers_OnlyOneAcquires()
    {
        var commands = new FakeRedisLockCommands();
        var worker1 = CreateLock(commands);
        var worker2 = CreateLock(commands);

        var first = await worker1.AcquireAsync("cron:test", "worker-1", TimeSpan.FromSeconds(30));
        var second = await worker2.AcquireAsync("cron:test", "worker-2", TimeSpan.FromSeconds(30));

        first.Should().BeTrue();
        second.Should().BeFalse("only one worker may hold the same lock key");
    }

    [Fact]
    public async Task Release_AllowsReacquire()
    {
        var commands = new FakeRedisLockCommands();
        var worker1 = CreateLock(commands);
        var worker2 = CreateLock(commands);

        (await worker1.AcquireAsync("cron:test", "worker-1", TimeSpan.FromSeconds(30))).Should().BeTrue();

        await worker1.ReleaseAsync("cron:test", "worker-1");

        (await worker2.AcquireAsync("cron:test", "worker-2", TimeSpan.FromSeconds(30))).Should().BeTrue();
    }

    [Fact]
    public async Task Release_WithWrongToken_KeepsLock()
    {
        var commands = new FakeRedisLockCommands();
        var worker1 = CreateLock(commands);
        var worker2 = CreateLock(commands);

        (await worker1.AcquireAsync("cron:test", "worker-1", TimeSpan.FromSeconds(30))).Should().BeTrue();

        await worker1.ReleaseAsync("cron:test", "wrong-token");

        (await worker2.AcquireAsync("cron:test", "worker-2", TimeSpan.FromSeconds(30))).Should().BeFalse("a release with the wrong token must not free the lock");
    }

    // NOTE: TTL-expiry self-free is not pinned here — the fake has no clock
    // control, so it would need a real delay. Skipped deliberately.

    [Fact]
    public async Task DifferentKey_Independent()
    {
        var commands = new FakeRedisLockCommands();
        var worker1 = CreateLock(commands);
        var worker2 = CreateLock(commands);

        var first = await worker1.AcquireAsync("cron:a", "worker-1", TimeSpan.FromSeconds(30));
        var second = await worker2.AcquireAsync("cron:b", "worker-2", TimeSpan.FromSeconds(30));

        first.Should().BeTrue();
        second.Should().BeTrue("different lock keys must not block each other");
    }

    /// <summary>
    /// In-memory stand-in for <see cref="IRedisLockCommands"/>: SET NX keyed
    /// by the full Redis key with TTL, compare-delete removes only on token
    /// match — the same semantics the Lua release script gives on Redis.
    /// </summary>
    private sealed class FakeRedisLockCommands : IRedisLockCommands
    {
        private readonly Dictionary<string, (string Token, DateTimeOffset ExpiresAt)> _locks = new(StringComparer.Ordinal);

        public Task<bool> SetIfNotExistsAsync(string key, string value, TimeSpan expiry, CancellationToken cancellationToken = default)
        {
            lock (_locks)
            {
                if (_locks.TryGetValue(key, out var existing) && existing.ExpiresAt > DateTimeOffset.UtcNow)
                {
                    return Task.FromResult(false);
                }

                _locks[key] = (value, DateTimeOffset.UtcNow.Add(expiry));
                return Task.FromResult(true);
            }
        }

        public Task CompareDeleteAsync(string key, string expectedValue, CancellationToken cancellationToken = default)
        {
            lock (_locks)
            {
                if (_locks.TryGetValue(key, out var existing) && existing.Token == expectedValue)
                {
                    _locks.Remove(key);
                }

                return Task.CompletedTask;
            }
        }
    }
}
