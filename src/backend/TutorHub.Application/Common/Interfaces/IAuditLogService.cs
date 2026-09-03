namespace TutorHub.Application.Common.Interfaces;

public interface IAuditLogService
{
    Task LogAsync(
        string action,
        string entityName,
        string entityId,
        Guid? userId = null,
        object? oldValues = null,
        object? newValues = null,
        string? correlationId = null,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken cancellationToken = default);
}
