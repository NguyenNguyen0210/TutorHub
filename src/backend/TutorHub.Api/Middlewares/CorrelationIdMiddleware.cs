using Serilog.Context;

namespace TutorHub.Api.Middlewares;

public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;
    public const string CorrelationIdHeader = "X-Correlation-ID";

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Headers.TryGetValue(CorrelationIdHeader, out var correlationId) ||
            string.IsNullOrWhiteSpace(correlationId))
        {
            correlationId = Guid.NewGuid().ToString("N");
        }

        context.TraceIdentifier = correlationId!;
        context.Response.Headers[CorrelationIdHeader] = correlationId!;

        // WP7: every log emitted downstream (console + Seq) carries this id.
        using (LogContext.PushProperty("CorrelationId", correlationId.ToString()))
        {
            await _next(context);
        }
    }
}
