using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Admin.AuditLogs.DTOs;
using TutorHub.Application.Features.Admin.AuditLogs.GetAdminAuditLogs;

namespace TutorHub.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/v1/admin/audit-logs")]
public class AdminAuditLogsController : ControllerBase
{
    private readonly ISender _sender;

    public AdminAuditLogsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Admin: Query immutable central audit logs with comprehensive filters.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<AdminAuditLogListResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] Guid? userId = null,
        [FromQuery] string? entityName = null,
        [FromQuery] string? entityId = null,
        [FromQuery] string? correlationId = null,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new AdminGetAuditLogsQuery(
            UserId: userId,
            EntityName: entityName,
            EntityId: entityId,
            CorrelationId: correlationId,
            DateFrom: dateFrom,
            DateTo: dateTo,
            PageNumber: pageNumber,
            PageSize: pageSize
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<AdminAuditLogListResponseDto>.SuccessResult(result, "Audit logs retrieved successfully."));
    }
}
