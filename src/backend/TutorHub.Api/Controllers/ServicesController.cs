using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Services.DTOs;
using TutorHub.Application.Features.Services.GetPublicServices;
using TutorHub.Domain.Enums;

using TutorHub.Application.Features.Services.GetServiceDetail;

namespace TutorHub.Api.Controllers;

[ApiController]
[Route("api/v1/services")]
public class ServicesController : ControllerBase
{
    private readonly ISender _sender;

    public ServicesController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Get published learning services with multi-dimensional filtering, searching and pagination (Public).
    /// </summary>
    [AllowAnonymous]
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PublicServiceListItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetServices(
        [FromQuery] Guid? categoryId,
        [FromQuery] Guid? subjectId,
        [FromQuery] TeachingMode? teachingMode,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] decimal? minRating,
        [FromQuery] string? search,
        [FromQuery] string? sortBy,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken cancellationToken = default)
    {
        var query = new GetPublicServicesQuery(
            CategoryId: categoryId,
            SubjectId: subjectId,
            TeachingMode: teachingMode,
            MinPrice: minPrice,
            MaxPrice: maxPrice,
            MinRating: minRating,
            Search: search,
            SortBy: sortBy,
            PageNumber: pageNumber,
            PageSize: pageSize
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<PublicServiceListItemDto>>.SuccessResult(result, "Services retrieved successfully."));
    }

    /// <summary>
    /// Get published service detail by ID with curriculum, tutor info, reviews and FAQs (Public).
    /// </summary>
    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ServiceDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetServiceDetail(Guid id, CancellationToken cancellationToken)
    {
        Guid? currentUserId = null;
        var subClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(subClaim, out var parsedGuid))
        {
            currentUserId = parsedGuid;
        }

        var query = new GetServiceDetailQuery(id, currentUserId);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<ServiceDetailDto>.SuccessResult(result, "Service details retrieved successfully."));
    }
}

