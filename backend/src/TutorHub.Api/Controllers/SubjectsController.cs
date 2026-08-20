using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Subjects.DTOs;
using TutorHub.Application.Features.Subjects.GetPublicSubjectById;
using TutorHub.Application.Features.Subjects.GetPublicSubjects;

namespace TutorHub.Api.Controllers;

[ApiController]
[Route("api/v1/subjects")]
public class SubjectsController : ControllerBase
{
    private readonly ISender _sender;

    public SubjectsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Get paginated list of active subjects with optional category and search filters (Public).
    /// </summary>
    [AllowAnonymous]
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PublicSubjectDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSubjects(
        [FromQuery] Guid? categoryId,
        [FromQuery] string? search,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new GetPublicSubjectsQuery(categoryId, search, pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<PublicSubjectDto>>.SuccessResult(result, "Subjects retrieved successfully."));
    }

    /// <summary>
    /// Get details of an active subject by ID (Public).
    /// </summary>
    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<PublicSubjectDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSubjectById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var query = new GetPublicSubjectByIdQuery(id);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PublicSubjectDto>.SuccessResult(result, "Subject retrieved successfully."));
    }
}
