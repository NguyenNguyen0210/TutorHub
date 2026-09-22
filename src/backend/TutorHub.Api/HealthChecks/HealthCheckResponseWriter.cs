using System.Text.Json;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace TutorHub.Api.HealthChecks;

/// <summary>
/// P0-E3: compact, operator-facing JSON for probe consumers.
///
/// Deliberately NOT the <c>ApiResponse</c> envelope: this endpoint is consumed by
/// container orchestrators and `curl -f` (which read the status code), and by a
/// human debugging a rollout. Wrapping diagnostics in the client envelope would
/// add nothing for either.
/// </summary>
public static class HealthCheckResponseWriter
{
    public static Task WriteAsync(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json; charset=utf-8";

        var payload = new Dictionary<string, object?>
        {
            ["status"] = report.Status.ToString(),
            ["durationMs"] = Math.Round(report.TotalDuration.TotalMilliseconds, 1),
            ["checks"] = report.Entries.ToDictionary(
                entry => entry.Key,
                entry => (object?)new Dictionary<string, object?>
                {
                    ["status"] = entry.Value.Status.ToString(),
                    ["description"] = entry.Value.Description,
                    ["error"] = entry.Value.Exception?.Message
                })
        };

        return context.Response.WriteAsync(JsonSerializer.Serialize(payload));
    }
}
