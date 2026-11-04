using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Admin.Services.GetAdminServices;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.Controllers;
[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/v1/admin/services")]
public class AdminServicesController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? search, [FromQuery] ServiceStatus? status,
        [FromQuery] Guid? tutorUserId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default) =>
        Ok(ApiResponse<PagedResult<AdminServiceDto>>.SuccessResult(await sender.Send(new GetAdminServicesQuery(search, status, tutorUserId, PageNumber: pageNumber, PageSize: pageSize), ct)));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Detail(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetAdminServicesQuery(ServiceId: id, PageSize: 1), ct);
        return Ok(ApiResponse<AdminServiceDto>.SuccessResult(result.Items.SingleOrDefault() ?? throw new NotFoundException("Service", id)));
    }
}
