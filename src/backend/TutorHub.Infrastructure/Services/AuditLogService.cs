using System.Text.Json;
using Microsoft.AspNetCore.Http;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Entities;

namespace TutorHub.Infrastructure.Services;

public class AuditLogService : IAuditLogService
{
    private readonly IAppDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = false,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public AuditLogService(IAppDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public Task LogAsync(
        string action,
        string entityName,
        string entityId,
        Guid? userId = null,
        object? oldValues = null,
        object? newValues = null,
        string? correlationId = null,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken cancellationToken = default)
    {
        var httpContext = _httpContextAccessor.HttpContext;

        var effectiveCorrelationId = correlationId;
        if (string.IsNullOrWhiteSpace(effectiveCorrelationId) && httpContext != null)
        {
            if (httpContext.Request.Headers.TryGetValue("X-Correlation-ID", out var headerVal))
            {
                effectiveCorrelationId = headerVal.ToString();
            }
            else
            {
                effectiveCorrelationId = httpContext.TraceIdentifier;
            }
        }
        if (string.IsNullOrWhiteSpace(effectiveCorrelationId))
        {
            effectiveCorrelationId = Guid.NewGuid().ToString("N");
        }

        var effectiveIp = ipAddress ?? httpContext?.Connection?.RemoteIpAddress?.ToString();
        var effectiveUserAgent = userAgent ?? httpContext?.Request?.Headers["User-Agent"].ToString();

        var oldJson = oldValues != null ? (oldValues is string s1 ? s1 : JsonSerializer.Serialize(oldValues, JsonOptions)) : null;
        var newJson = newValues != null ? (newValues is string s2 ? s2 : JsonSerializer.Serialize(newValues, JsonOptions)) : null;

        var log = new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            OldValuesJson = oldJson,
            NewValuesJson = newJson,
            CorrelationId = effectiveCorrelationId,
            IpAddress = effectiveIp?.Length > 45 ? effectiveIp[..45] : effectiveIp,
            UserAgent = effectiveUserAgent?.Length > 500 ? effectiveUserAgent[..500] : effectiveUserAgent,
            CreatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(log);
        return Task.CompletedTask;
    }
}
