namespace TutorHub.Application.Common.Caching;

/// <summary>
/// Configuration defaults for per-user JWT revocation:
/// the <c>ver</c> claim minted into every access token, the Redis key it is
/// compared against, and how long a cached version lives (one access-token
/// lifetime plus skew, so a stale entry can never outlive the tokens it gates).
/// </summary>
public static class TokenVersionDefaults
{
    public const string VersionClaimType = "ver";

    public const string CacheKeyPrefix = "auth:ver:";

    public static readonly TimeSpan CacheLifetime = TimeSpan.FromMinutes(16);

    public static string CacheKeyFor(Guid userId) => $"{CacheKeyPrefix}{userId}";
}
