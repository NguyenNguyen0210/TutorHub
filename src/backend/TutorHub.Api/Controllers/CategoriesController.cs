using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Categories.DTOs;
using TutorHub.Application.Features.Categories.GetPublicCategories;
using TutorHub.Application.Features.Categories.GetPublicCategoryById;

namespace TutorHub.Api.Controllers;

[ApiController]
[Route("api/v1/categories")]
public class CategoriesController : ControllerBase
{
    private readonly ISender _sender;

    public CategoriesController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Get list of active categories with their active nested subjects (Public).
    /// </summary>
    [AllowAnonymous]
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<PublicCategoryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategories(CancellationToken cancellationToken)
    {
        var query = new GetPublicCategoriesQuery();
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<PublicCategoryDto>>.SuccessResult(result, "Categories retrieved successfully."));
    }

    /// <summary>
    /// Get details of an active category by ID with its active subjects (Public).
    /// </summary>
    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<PublicCategoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCategoryById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var query = new GetPublicCategoryByIdQuery(id);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PublicCategoryDto>.SuccessResult(result, "Category retrieved successfully."));
    }
}
