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
    /// Admin: Read audit records; date filters use inclusive Vietnam calendar days.
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
        [FromQuery] string? search = null,
        [FromQuery] string? action = null,
        [FromQuery] bool oldestFirst = false,
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
            PageSize: pageSize,
            Search: search,
            Action: action,
            OldestFirst: oldestFirst
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<AdminAuditLogListResponseDto>.SuccessResult(result, "Audit logs retrieved successfully."));
    }

    [HttpGet("options")]
    public async Task<IActionResult> GetOptions(CancellationToken cancellationToken) =>
        Ok(ApiResponse<AdminAuditOptionsDto>.SuccessResult(await _sender.Send(new AdminGetAuditOptionsQuery(), cancellationToken)));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new AdminGetAuditLogsQuery(PageSize: 1, LogId: id), cancellationToken);
        var item = result.Items.SingleOrDefault();
        return item == null ? NotFound(ApiResponse<object>.FailureResult("Không tìm thấy bản ghi kiểm toán."))
            : Ok(ApiResponse<AuditLogDto>.SuccessResult(item));
    }
}
