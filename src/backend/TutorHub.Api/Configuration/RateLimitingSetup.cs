using System.Text.Json;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using TutorHub.Application.Common.Models;

namespace TutorHub.Api.Configuration;

/// <summary>P0-D2 policy names, referenced by <c>[EnableRateLimiting]</c> attributes.</summary>
public static class RateLimitingPolicies
{
    /// <summary>Credential endpoints: strict, per client IP.</summary>
    public const string AuthStrict = "auth-strict";

    /// <summary>Gateway callbacks (IPN / return): generous but still bounded.</summary>
    public const string Payment = "payment";

    /// <summary>
    /// Per-minute budgets, single-sourced here so the in-memory limiter
    /// (<see cref="RateLimitingSetup"/>) and the Redis limiter
    /// (WP3 fixed window) can never drift apart.
    /// </summary>
    public const int AuthPermitLimit = 10;

    public const int PaymentPermitLimit = 60;

    public const int GlobalPermitLimit = 300;
}

/// <summary>
/// P0-D2: request throttling for the unauthenticated, abuse-prone endpoints
/// (login/register/refresh and the VNPay callbacks).
///
/// Partitioning uses in-memory fixed windows, which is intentional for the
/// single-instance deployment this release targets. Scaling out would require a
/// distributed store (or sticky routing), otherwise each instance throttles on its own.
/// </summary>
public static class RateLimitingSetup
{
    private static readonly TimeSpan Window = TimeSpan.FromMinutes(1);

    public static IServiceCollection AddTutorHubRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.AddPolicy(RateLimitingPolicies.AuthStrict, httpContext =>
                FixedWindow(httpContext, RateLimitingPolicies.AuthPermitLimit));

            options.AddPolicy(RateLimitingPolicies.Payment, httpContext =>
                FixedWindow(httpContext, RateLimitingPolicies.PaymentPermitLimit));

            // Fallback so every endpoint is bounded, even ones without an attribute.
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
                httpContext => FixedWindow(httpContext, RateLimitingPolicies.GlobalPermitLimit));

            options.OnRejected = async (context, cancellationToken) =>
            {
                var retryAfterSeconds = (int)Math.Ceiling(Window.TotalSeconds);
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    retryAfterSeconds = (int)Math.Ceiling(retryAfter.TotalSeconds);
                }

                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.HttpContext.Response.Headers.RetryAfter = retryAfterSeconds.ToString();

                // Keep the documented ApiResponse envelope (camelCase) instead of the
                // framework default, so clients parse 429 exactly like every other error.
                var payload = JsonSerializer.Serialize(
                    ApiResponse<object>.FailureResult("Too many requests. Please retry later."),
                    new JsonSerializerOptions(JsonSerializerDefaults.Web));

                context.HttpContext.Response.ContentType = "application/json";
                await context.HttpContext.Response.WriteAsync(payload, cancellationToken);
            };
        });

        return services;
    }

    private static RateLimitPartition<string> FixedWindow(HttpContext httpContext, int permitLimit) =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ClientKey(httpContext),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permitLimit,
                Window = Window,
                QueueLimit = 0
            });

    /// <summary>
    /// The partition key. RemoteIpAddress is only trustworthy when
    /// <c>ReverseProxy:Enabled</c> is on and the proxy is trusted — otherwise every
    /// client shares the proxy's address, which is fail-closed (all throttled together)
    /// rather than fail-open.
    /// </summary>
    private static string ClientKey(HttpContext httpContext) =>
        httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}
