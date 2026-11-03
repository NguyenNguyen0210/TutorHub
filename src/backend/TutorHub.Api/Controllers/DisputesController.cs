using TutorHub.Application.Features.Disputes.Commands.SubmitDisputeResponse;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Disputes.Commands.CreateDispute;
using TutorHub.Application.Features.Disputes.Commands.UploadDisputeEvidence;
using TutorHub.Application.Features.Disputes.DTOs;
using TutorHub.Application.Features.Disputes.Queries.GetMyDisputes;

namespace TutorHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/disputes")]
public class DisputesController : ControllerBase
{
    private readonly ISender _sender;

    public DisputesController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// File a dispute on a session within its 12-hour grace period (pre-release only).
    /// A session past grace without a report is deemed accepted and cannot be disputed.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<DisputeDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateDispute(
        [FromBody] CreateDisputeCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(command, cancellationToken);
        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<DisputeDto>.SuccessResult(result, "Dispute created successfully and is under investigation.")
        );
    }

    [HttpPost("{id:guid}/responses")]
    [ProducesResponseType(typeof(ApiResponse<DisputeResponseDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> SubmitResponse([FromRoute] Guid id, [FromBody] SubmitResponseRequest request, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new SubmitDisputeResponseCommand(id, request.SubmissionId, request.Content), cancellationToken);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<DisputeResponseDto>.SuccessResult(result));
    }

    /// <summary>
    /// Upload supporting evidence file (multipart/form-data) for an active dispute with binary signature validation.
    /// </summary>
    [HttpPost("{id:guid}/evidence")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<DisputeEvidenceDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadEvidenceForm(
        [FromRoute] Guid id,
        IFormFile file,
        [FromForm] Guid? responseId,
        CancellationToken cancellationToken)
    {
        if (file == null) throw new BadRequestException("No file was uploaded.");
        await using var stream = file.OpenReadStream();
        var result = await _sender.Send(new UploadDisputeEvidenceCommand(id, file.FileName, stream, file.Length, responseId), cancellationToken);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<DisputeEvidenceDto>.SuccessResult(result));
    }

    [HttpGet("{id:guid}/evidence/{evidenceId:guid}/download")]
    public async Task<IActionResult> DownloadEvidence(Guid id, Guid evidenceId, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new TutorHub.Application.Features.Disputes.Queries.DownloadEvidence.DownloadDisputeEvidenceQuery(id, evidenceId), cancellationToken);
        Response.Headers.CacheControl = "private, no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return File(result.Content, "application/octet-stream", result.FileName);
    }

    /// <summary>
    /// Get disputes involving the current user as initiator or respondent.
    /// </summary>
    [HttpGet("my")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<DisputeDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyDisputes(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetMyDisputesQuery(), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<DisputeDto>>.SuccessResult(result, "User disputes retrieved successfully."));
    }
}

public record SubmitResponseRequest(Guid SubmissionId, string Content);
