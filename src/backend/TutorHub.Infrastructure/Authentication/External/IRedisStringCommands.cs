using StackExchange.Redis;

namespace TutorHub.Infrastructure.Authentication.External;

/// <summary>
/// Minimal seam over the Redis string commands the OAuth state store needs.
/// <see cref="IDatabase"/> is an interface, but a very wide one (dozens of
/// members with overloads), so faking it by hand is brittle — the store
/// depends on this two-method seam instead and the single production
/// implementation below delegates to it.
/// </summary>
public interface IRedisStringCommands
{
    /// <summary>
    /// SET key value EX expiry [NX when <paramref name="whenNotExists"/>].
    /// Returns false instead of overwriting when NX collides.
    /// </summary>
    bool StringSet(string key, string value, TimeSpan expiry, bool whenNotExists, CancellationToken cancellationToken = default);

    /// <summary>GETDEL key: returns the value and removes it atomically, or null.</summary>
    string? StringGetDelete(string key, CancellationToken cancellationToken = default);
}

/// <summary>Production <see cref="IRedisStringCommands"/> backed by StackExchange.Redis.</summary>
public sealed class StackExchangeRedisStringCommands : IRedisStringCommands
{
    private readonly IDatabase _database;

    public StackExchangeRedisStringCommands(IDatabase database)
    {
        _database = database;
    }

    public bool StringSet(string key, string value, TimeSpan expiry, bool whenNotExists, CancellationToken cancellationToken = default)
    {
        // IExternalAuthStateStore is synchronous, so the block lives here at the
        // edge rather than in the store. Safe on ASP.NET Core (no sync context).
        return _database.StringSetAsync(
            key,
            value,
            expiry,
            when: whenNotExists ? When.NotExists : When.Always).GetAwaiter().GetResult();
    }

    public string? StringGetDelete(string key, CancellationToken cancellationToken = default) =>
        // GETDEL needs redis >= 6.2; the compose image is redis:7-alpine.
        // StringGetDeleteAsync takes no CancellationToken, so it is dropped here.
        _database.StringGetDeleteAsync(key).GetAwaiter().GetResult();
}
