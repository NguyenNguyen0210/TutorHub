using System.Text.Json;
using Microsoft.AspNetCore.RateLimiting;
using TutorHub.Application.Common.Models;

namespace TutorHub.Api.RateLimiting;

/// <summary>
/// WP3: Redis-backed replacement for the in-memory rate limiter. Reads the
/// <see cref="EnableRateLimitingAttribute"/> policy from endpoint metadata
/// (no attribute means the global policy, matching GlobalLimiter semantics)
/// and counts through <see cref="RedisRateLimitService"/> so every node
/// shares one budget. Rejections keep the exact 429 envelope the in-memory
/// limiter returns, so clients cannot tell which backend throttled them.
/// </summary>
public sealed class RedisRateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly RedisRateLimitService _rateLimits;

    public RedisRateLimitMiddleware(RequestDelegate next, RedisRateLimitService rateLimits)
    {
        _next = next;
        _rateLimits = rateLimits;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var policy = context.GetEndpoint()?.Metadata.GetMetadata<EnableRateLimitingAttribute>()?.PolicyName
            ?? RedisRateLimitService.GlobalPolicyName;

        var decision = await _rateLimits.CheckAsync(policy, ClientKey(context), context.RequestAborted).ConfigureAwait(false);
        if (decision.Allowed)
        {
            await _next(context).ConfigureAwait(false);
            return;
        }

        context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.Response.Headers.RetryAfter = decision.RetryAfterSeconds.ToString();

        // Keep the documented ApiResponse envelope (camelCase) instead of a
        // plain-text 429, exactly like RateLimitingSetup.OnRejected.
        var payload = JsonSerializer.Serialize(
            ApiResponse<object>.FailureResult("Too many requests. Please retry later."),
            new JsonSerializerOptions(JsonSerializerDefaults.Web));

        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync(payload).ConfigureAwait(false);
    }

    /// <summary>
    /// The partition key. RemoteIpAddress is only trustworthy when
    /// <c>ReverseProxy:Enabled</c> is on and the proxy is trusted — otherwise every
    /// client shares the proxy's address, which is fail-closed (all throttled together)
    /// rather than fail-open. Same logic as RateLimitingSetup.ClientKey.
    /// </summary>
    private static string ClientKey(HttpContext context) =>
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}
