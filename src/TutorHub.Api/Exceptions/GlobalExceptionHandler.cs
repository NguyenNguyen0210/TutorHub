using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Diagnostics;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;

namespace TutorHub.Api.Exceptions;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IHostEnvironment _environment;

    public GlobalExceptionHandler(
        ILogger<GlobalExceptionHandler> logger,
        IHostEnvironment environment)
    {
        _logger = logger;
        _environment = environment;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var traceId = httpContext.TraceIdentifier;

        _logger.LogError(
            exception,
            "Unhandled exception occurred. TraceId: {TraceId}, Message: {Message}",
            traceId,
            exception.Message);

        var (statusCode, errorCode, message, details) = exception switch
        {
            ValidationException ve => (
                ve.StatusCode,
                ve.ErrorCode,
                ve.Message,
                ve.Errors
            ),
            AppException appEx => (
                appEx.StatusCode,
                appEx.ErrorCode,
                appEx.Message,
                null
            ),
            _ => (
                HttpStatusCode.InternalServerError,
                "INTERNAL_SERVER_ERROR",
                _environment.IsDevelopment() ? exception.Message : "An unexpected server error occurred.",
                null
            )
        };

        httpContext.Response.ContentType = "application/json";
        httpContext.Response.StatusCode = (int)statusCode;

        var response = ApiResponse<object>.FailureResult(errorCode, message, details, traceId);

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        await httpContext.Response.WriteAsync(
            JsonSerializer.Serialize(response, jsonOptions),
            cancellationToken);

        return true;
    }
}
