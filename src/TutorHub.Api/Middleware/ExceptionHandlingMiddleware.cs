using System.Net;
using System.Text.Json;
using TutorHub.Application.Common.Exceptions;

namespace TutorHub.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
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
        _logger.LogError(exception, "An error occurred: {Message}", exception.Message);

        var (statusCode, code, message) = exception switch
        {
            ValidationException ve => (HttpStatusCode.BadRequest, "VALIDATION_ERROR", ve.Message),
            UnauthorizedException ue => (HttpStatusCode.Unauthorized, "UNAUTHORIZED", ue.Message),
            NotFoundException ne => (HttpStatusCode.NotFound, "NOT_FOUND", ne.Message),
            ConflictException ce => (HttpStatusCode.Conflict, "CONFLICT", ce.Message),
            _ => (HttpStatusCode.InternalServerError, "INTERNAL_SERVER_ERROR", "An unexpected error occurred.")
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            error = new
            {
                code = code,
                message = message
            }
        };

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }
}
