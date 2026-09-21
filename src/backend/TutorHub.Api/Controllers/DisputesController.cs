using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Files;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Common.Storage;
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
    private readonly IObjectStorageService _storageService;

    public DisputesController(ISender sender, IObjectStorageService storageService)
    {
        _sender = sender;
        _storageService = storageService;
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
    /// Upload supporting evidence file (multipart/form-data) for an active dispute with binary signature validation.
    /// </summary>
    [HttpPost("{id:guid}/evidence")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<DisputeEvidenceDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadEvidenceForm(
        [FromRoute] Guid id,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            throw new BadRequestException("No file was uploaded or file is empty.");
        }

        if (file.Length > UploadLimits.EvidenceMaxBytes)
        {
            throw new BadRequestException($"File size exceeds the maximum allowed limit of {UploadLimits.EvidenceMaxBytes / 1024 / 1024}MB.");
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

        await using var stream = file.OpenReadStream();
        if (!FileSignatureValidator.IsValidSignature(stream, ext, out var detectedMime) ||
            !UploadLimits.EvidenceMimeTypes.Contains(detectedMime))
        {
            throw new BadRequestException("File binary signature does not match allowed evidence types (JPG, PNG, WEBP, PDF, TXT).");
        }

        var uniqueKey = $"reports/evidence/{id:N}/{Guid.NewGuid():N}{ext}";
        var stored = await _storageService.UploadAsync(stream, uniqueKey, detectedMime, cancellationToken);
        var downloadUrl = await _storageService.GenerateDownloadUrlAsync(stored.ObjectKey, TimeSpan.FromDays(7), cancellationToken);

        var command = new UploadDisputeEvidenceCommand(
            DisputeId: id,
            FileName: file.FileName,
            FileUrl: downloadUrl,
            ContentType: detectedMime,
            FileSizeBytes: stored.Size
        );

        var result = await _sender.Send(command, cancellationToken);
        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<DisputeEvidenceDto>.SuccessResult(result, "Evidence uploaded successfully.")
        );
    }

    /// <summary>
    /// Upload supporting evidence metadata (application/json) for an active dispute (backwards compatible).
    /// </summary>
    [HttpPost("{id:guid}/evidence")]
    [Consumes("application/json")]
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
        var result = await _sender.Send(new GetMyDisputesQuery(), cancellationToken);
        return Ok(ApiResponse<List<DisputeDto>>.SuccessResult(result, "User disputes retrieved successfully."));
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
