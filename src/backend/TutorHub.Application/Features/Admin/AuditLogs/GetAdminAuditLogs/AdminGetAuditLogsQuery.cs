using MediatR;
using TutorHub.Application.Features.Admin.AuditLogs.DTOs;

namespace TutorHub.Application.Features.Admin.AuditLogs.GetAdminAuditLogs;

public record AdminGetAuditLogsQuery(
    Guid? UserId = null,
    string? EntityName = null,
    string? EntityId = null,
    string? CorrelationId = null,
    DateTime? DateFrom = null,
    DateTime? DateTo = null,
    int PageNumber = 1,
    int PageSize = 20
) : IRequest<AdminAuditLogListResponseDto>;
