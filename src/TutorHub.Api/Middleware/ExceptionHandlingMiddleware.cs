using System.Net;
using System.Text.Json;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;

namespace TutorHub.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        _logger.LogError(exception, "Unhandled exception occurred: {Message}", exception.Message);

        var (statusCode, code, message, details) = exception switch
        {
            ValidationException ve => (
                HttpStatusCode.BadRequest,
                "VALIDATION_ERROR",
                ve.Message,
                ve.Errors
            ),
            BadRequestException bre => (
                HttpStatusCode.BadRequest,
                "BAD_REQUEST",
                bre.Message,
                (IDictionary<string, string[]>?)null
            ),
            UnauthorizedException ue => (
                HttpStatusCode.Unauthorized,
                "UNAUTHORIZED",
                ue.Message,
                null
            ),
            ForbiddenException fe => (
                HttpStatusCode.Forbidden,
                "FORBIDDEN",
                fe.Message,
                null
            ),
            NotFoundException ne => (
                HttpStatusCode.NotFound,
                "NOT_FOUND",
                ne.Message,
                null
            ),
            ConflictException ce => (
                HttpStatusCode.Conflict,
                "CONFLICT",
                ce.Message,
                null
            ),
            _ => (
                HttpStatusCode.InternalServerError,
                "INTERNAL_SERVER_ERROR",
                _environment.IsDevelopment() ? exception.Message : "An unexpected server error occurred.",
                null
            )
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = ApiResponse<object>.FailureResult(code, message, details);

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }
}
