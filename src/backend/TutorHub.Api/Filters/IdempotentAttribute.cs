using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;

namespace TutorHub.Api.Filters;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false, Inherited = true)]
public class IdempotentAttribute : Attribute, IAsyncActionFilter
{
    public const string IdempotencyKeyHeader = "Idempotency-Key";
    public const string AltIdempotencyKeyHeader = "X-Idempotency-Key";
    public const string IdempotencyReplayHeader = "Idempotency-Replay";

    /// <summary>
    /// Retention time in hours for the cached response (defaults to 24 hours).
    /// </summary>
    public int ExpirationHours { get; set; } = 24;

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var httpContext = context.HttpContext;

        // Check for idempotency key in headers (optional opt-in)
        if (!httpContext.Request.Headers.TryGetValue(IdempotencyKeyHeader, out var keyVal) &&
            !httpContext.Request.Headers.TryGetValue(AltIdempotencyKeyHeader, out keyVal))
        {
            await next();
            return;
        }

        var key = keyVal.ToString().Trim();
        if (string.IsNullOrWhiteSpace(key) || key.Length > 128)
        {
            context.Result = new BadRequestObjectResult(ApiResponse<object>.FailureResult(
                "Idempotency-Key header is invalid. Must be non-empty ASCII up to 128 characters."));
            return;
        }

        Guid? userId = null;
        var sub = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(sub, out var parsedUserId))
        {
            userId = parsedUserId;
        }

        var requestHash = await RequestFingerprintHelper.ComputeHashAsync(httpContext.Request, userId, httpContext.RequestAborted);

        var store = httpContext.RequestServices.GetRequiredService<IIdempotencyStore>();

        var acquireResult = await store.TryAcquireAsync(
            key,
            userId,
            httpContext.Request.Path,
            requestHash,
            TimeSpan.FromHours(ExpirationHours),
            httpContext.RequestAborted);

        switch (acquireResult.Status)
        {
            case IdempotencyStatus.InFlight:
                context.Result = new ConflictObjectResult(ApiResponse<object>.FailureResult(
                    acquireResult.ErrorMessage ?? "A request with the same Idempotency-Key is currently in progress. Please retry after it completes."));
                return;

            case IdempotencyStatus.PayloadMismatch:
                context.Result = new ObjectResult(ApiResponse<object>.FailureResult(
                    acquireResult.ErrorMessage ?? "Idempotency-Key has already been used with a different request payload."))
                {
                    StatusCode = StatusCodes.Status422UnprocessableEntity
                };
                return;

            case IdempotencyStatus.CachedAvailable:
                httpContext.Response.Headers[IdempotencyKeyHeader] = key;
                httpContext.Response.Headers[IdempotencyReplayHeader] = "true";
                context.Result = new ContentResult
                {
                    StatusCode = acquireResult.CachedStatusCode ?? StatusCodes.Status200OK,
                    ContentType = acquireResult.CachedContentType ?? "application/json; charset=utf-8",
                    Content = acquireResult.CachedResponseBody ?? string.Empty
                };
                return;

            case IdempotencyStatus.Acquired:
            default:
                break;
        }

        httpContext.Response.Headers[IdempotencyKeyHeader] = key;

        ActionExecutedContext executedContext;
        try
        {
            executedContext = await next();
        }
        catch (Exception)
        {
            await store.ReleaseFailedAsync(key, userId, CancellationToken.None);
            throw;
        }

        if (executedContext.Exception != null && !executedContext.ExceptionHandled)
        {
            await store.ReleaseFailedAsync(key, userId, CancellationToken.None);
            return;
        }

        await SaveResponseAsync(store, key, userId, executedContext, httpContext);
    }

    private static async Task SaveResponseAsync(
        IIdempotencyStore store,
        string key,
        Guid? userId,
        ActionExecutedContext executedContext,
        HttpContext httpContext)
    {
        int statusCode = StatusCodes.Status200OK;
        string contentType = "application/json; charset=utf-8";
        string responseBody = string.Empty;

        if (executedContext.Result is ObjectResult objectResult)
        {
            statusCode = objectResult.StatusCode ?? StatusCodes.Status200OK;
            if (objectResult.Value != null)
            {
                var jsonOptions = httpContext.RequestServices.GetService<IOptions<JsonOptions>>()?.Value?.JsonSerializerOptions
                    ?? new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
                responseBody = JsonSerializer.Serialize(objectResult.Value, jsonOptions);
            }
        }
        else if (executedContext.Result is ContentResult contentResult)
        {
            statusCode = contentResult.StatusCode ?? StatusCodes.Status200OK;
            contentType = contentResult.ContentType ?? contentType;
            responseBody = contentResult.Content ?? string.Empty;
        }
        else if (executedContext.Result is StatusCodeResult statusCodeResult)
        {
            statusCode = statusCodeResult.StatusCode;
        }
        else
        {
            statusCode = httpContext.Response.StatusCode;
        }

        await store.SaveCompletedAsync(key, userId, statusCode, contentType, responseBody, CancellationToken.None);
    }
}
