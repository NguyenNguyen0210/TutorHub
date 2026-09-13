using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Disputes.Commands.CreateDispute;
using TutorHub.Application.Features.Disputes.Commands.UploadDisputeEvidence;
using TutorHub.Application.Features.Disputes.DTOs;
using TutorHub.Application.Features.Disputes.Queries.GetMyDisputes;
using TutorHub.Domain.Enums;

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
    /// File a dispute on a scheduled or completed session.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<DisputeDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateDispute(
        [FromBody] CreateDisputeRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CreateDisputeCommand(
            SessionId: request.SessionId,
            Reason: request.Reason,
            Description: request.Description
        );

        var result = await _sender.Send(command, cancellationToken);
        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<DisputeDto>.SuccessResult(result, "Dispute created successfully and is under investigation.")
        );
    }

    /// <summary>
    /// Upload supporting evidence for an active dispute.
    /// </summary>
    [HttpPost("{id:guid}/evidence")]
    [ProducesResponseType(typeof(ApiResponse<DisputeEvidenceDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> UploadEvidence(
        [FromRoute] Guid id,
        [FromBody] UploadEvidenceRequest request,
        CancellationToken cancellationToken)
    {
        var command = new UploadDisputeEvidenceCommand(
            DisputeId: id,
            FileName: request.FileName,
            FileUrl: request.FileUrl,
            ContentType: request.ContentType,
            FileSizeBytes: request.FileSizeBytes
        );

        var result = await _sender.Send(command, cancellationToken);
        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<DisputeEvidenceDto>.SuccessResult(result, "Evidence uploaded successfully.")
        );
    }

    /// <summary>
    /// Get disputes involving the current user as initiator or respondent.
    /// </summary>
    [HttpGet("my")]
    [ProducesResponseType(typeof(ApiResponse<List<DisputeDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyDisputes(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await _sender.Send(new GetMyDisputesQuery(userId), cancellationToken);
        return Ok(ApiResponse<List<DisputeDto>>.SuccessResult(result, "User disputes retrieved successfully."));
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedException("User ID is invalid or missing from token.");
        }
        return userId;
    }
}

public record CreateDisputeRequest(
    Guid SessionId,
    DisputeReason Reason,
    string Description
);

public record UploadEvidenceRequest(
    string FileName,
    string FileUrl,
    string ContentType,
    long FileSizeBytes
);
