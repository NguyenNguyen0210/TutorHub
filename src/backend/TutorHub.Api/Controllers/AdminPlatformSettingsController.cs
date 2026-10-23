using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.PlatformSettings.DTOs;
using TutorHub.Application.Features.PlatformSettings.Queries.AdminGetPlatformRevenueAnalytics;

namespace TutorHub.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/v1/admin")]
public class AdminPlatformSettingsController : ControllerBase
{
    private readonly ISender _sender;

    public AdminPlatformSettingsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Admin: Platform revenue analytics with net dispute fee reconciliation.
    /// </summary>
    [HttpGet("analytics/platform-revenue")]
    [ProducesResponseType(typeof(ApiResponse<PlatformRevenueAnalyticsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPlatformRevenueAnalytics(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new AdminGetPlatformRevenueAnalyticsQuery(), cancellationToken);
        return Ok(ApiResponse<PlatformRevenueAnalyticsDto>.SuccessResult(result, "Platform revenue analytics retrieved successfully."));
    }
}
