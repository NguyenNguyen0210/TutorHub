using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Enrollments.DTOs;
using TutorHub.Application.Features.Enrollments.GetMyEnrollments;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/v1/admin/enrollments")]
public class AdminEnrollmentsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? search, [FromQuery] EnrollmentStatus? status,
        [FromQuery] Guid? participantUserId, [FromQuery] Guid? serviceId,
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetMyEnrollmentsQuery(status, pageNumber, pageSize, search, participantUserId, serviceId), cancellationToken);
        return Ok(ApiResponse<PagedResult<EnrollmentSummaryDto>>.SuccessResult(result));
    }
}
