using System.Security.Claims;
using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Caching;
using TutorHub.Application.Common.Models;
using TutorHub.Infrastructure.Redis;

namespace TutorHub.Api.Middlewares;

/// <summary>
/// Pure version compare at the heart of WP6 revocation: only a token older
/// than the known version is dead. A newer token (stale cache entry lagging
/// the database) stays valid.
/// </summary>
public static class TokenVersionValidator
{
    public static bool IsRevoked(int tokenVersion, int cachedVersion) =>
        tokenVersion < cachedVersion;
}

/// <summary>
/// WP6: instant JWT revocation via per-user <c>ver</c> claim (PO decision
/// 2026-09-29 overrides F-08). Runs after <c>UseAuthorization</c> and only
/// for authenticated requests while <c>Redis:Features:RevokeCheck</c> is on;
/// otherwise requests pass through untouched (pre-Redis behavior).
///
/// Per authenticated request by design: one Redis GET, plus one indexed DB
/// read on cache miss (then cached for one access-token lifetime + skew).
/// Fail-closed: any cache or database error answers 401 instead of letting
/// a possibly-revoked token through. Writes the 401 envelope directly and
/// never routes through the <c>GlobalExceptionHandler</c>.
/// </summary>
public sealed class TokenRevocationMiddleware
{
    public const string RevokedMessage = "Session has been revoked. Please sign in again.";
    public const string VersionMissingMessage = "Token version missing.";
    public const string ServiceUnavailableMessage = "Authentication service unavailable.";

    private readonly RequestDelegate _next;
    private readonly IOptions<RedisOptions> _redisOptions;
    private readonly ILogger<TokenRevocationMiddleware> _logger;

    public TokenRevocationMiddleware(
        RequestDelegate next,
        IOptions<RedisOptions> redisOptions,
        ILogger<TokenRevocationMiddleware> logger)
    {
        _next = next;
        _redisOptions = redisOptions;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var redis = _redisOptions.Value;
        if (!redis.Enabled || !redis.Features.RevokeCheck)
        {
            await _next(context).ConfigureAwait(false);
            return;
        }

        if (context.User.Identity?.IsAuthenticated != true)
        {
            await _next(context).ConfigureAwait(false);
            return;
        }

        var userIdValue = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? context.User.FindFirstValue("sub");
        var versionValue = context.User.FindFirst(TokenVersionDefaults.VersionClaimType)?.Value;
        if (!Guid.TryParse(userIdValue, out var userId) ||
            !int.TryParse(versionValue, out var tokenVersion))
        {
            await DenyAsync(context, VersionMissingMessage).ConfigureAwait(false);
            return;
        }

        // IDistributedCache only exists when Redis is Enabled, so resolve
        // lazily per request: a missing registration fails closed instead of
        // crashing the pipeline at startup.
        var cache = context.RequestServices.GetService<IDistributedCache>();
        var reader = context.RequestServices.GetService<ITokenVersionReader>();
        if (cache is null || reader is null)
        {
            _logger.LogWarning(
                "Token revocation check is enabled but {Service} is not registered. Failing closed.",
                cache is null ? nameof(IDistributedCache) : nameof(ITokenVersionReader));
            await DenyAsync(context, ServiceUnavailableMessage).ConfigureAwait(false);
            return;
        }

        var key = TokenVersionDefaults.CacheKeyFor(userId);
        var cancellationToken = context.RequestAborted;

        string? cached;
        try
        {
            cached = await cache.GetStringAsync(key, cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Token version cache lookup failed for user {UserId}. Failing closed.", userId);
            await DenyAsync(context, ServiceUnavailableMessage).ConfigureAwait(false);
            return;
        }

        int effectiveVersion;
        if (cached is not null && int.TryParse(cached, out var cachedVersion))
        {
            effectiveVersion = cachedVersion;
        }
        else
        {
            int? dbVersion;
            try
            {
                dbVersion = await reader.GetTokenVersionAsync(userId, cancellationToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Token version database lookup failed for user {UserId}. Failing closed.", userId);
                await DenyAsync(context, ServiceUnavailableMessage).ConfigureAwait(false);
                return;
            }

            if (dbVersion is null)
            {
                await DenyAsync(context, RevokedMessage).ConfigureAwait(false);
                return;
            }

            effectiveVersion = dbVersion.Value;

            try
            {
                await cache.SetStringAsync(
                    key,
                    effectiveVersion.ToString(),
                    new DistributedCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = TokenVersionDefaults.CacheLifetime
                    },
                    cancellationToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                // The decision above already used the authoritative DB value,
                // so a failed cache fill only costs one more DB read next time.
                _logger.LogDebug(ex, "Best-effort token-version cache fill failed for user {UserId}.", userId);
            }
        }

        if (TokenVersionValidator.IsRevoked(tokenVersion, effectiveVersion))
        {
            await DenyAsync(context, RevokedMessage).ConfigureAwait(false);
            return;
        }

        await _next(context).ConfigureAwait(false);
    }

    private static async Task DenyAsync(HttpContext context, string message)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        context.Response.ContentType = "application/json";

        // Same ApiResponse envelope (camelCase) as the rate-limit 429 path.
        var payload = JsonSerializer.Serialize(
            ApiResponse<object>.FailureResult(message),
            new JsonSerializerOptions(JsonSerializerDefaults.Web));

        await context.Response.WriteAsync(payload).ConfigureAwait(false);
    }
}
