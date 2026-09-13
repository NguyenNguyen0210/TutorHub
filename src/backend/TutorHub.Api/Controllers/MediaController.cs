using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Media.CompleteUpload;
using TutorHub.Application.Features.Media.DeleteMedia;
using TutorHub.Application.Features.Media.DTOs;
using TutorHub.Application.Features.Media.GenerateUploadUrl;
using TutorHub.Application.Features.Media.GetMediaUrl;
using TutorHub.Application.Features.Media.UploadMedia;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.Controllers;

[ApiController]
[Route("api/v1/media")]
public class MediaController : ControllerBase
{
    private readonly ISender _sender;

    public MediaController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Generate a Presigned PUT URL for Frontend to upload binary directly to Cloudflare R2.
    /// </summary>
    [Authorize]
    [HttpPost("presigned-upload-url")]
    [ProducesResponseType(typeof(ApiResponse<UploadUrlDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GeneratePresignedUploadUrl(
        [FromBody] GenerateUploadUrlRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new GenerateUploadUrlCommand(
            FileName: request.FileName,
            ContentType: request.ContentType,
            EstimatedSize: request.EstimatedFileSize,
            MediaType: request.MediaType
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<UploadUrlDto>.SuccessResult(result, "Presigned upload URL generated successfully."));
    }

    /// <summary>
    /// Confirm direct upload completion: Verifies file existence on R2 (HEAD check) and persists metadata record in Database.
    /// </summary>
    [Authorize]
    [HttpPost("complete-upload")]
    [ProducesResponseType(typeof(ApiResponse<MediaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompleteUpload(
        [FromBody] CompleteUploadRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new CompleteUploadCommand(
            ObjectKey: request.ObjectKey,
            OriginalFileName: request.OriginalFileName,
            ContentType: request.ContentType,
            FileSize: request.FileSize,
            MediaType: request.MediaType
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<MediaDto>.SuccessResult(result, "Upload confirmed and media metadata registered successfully."));
    }

    /// <summary>
    /// Direct API stream upload to Cloudflare R2 with Magic Bytes binary validation (convenient for small files / avatars).
    /// </summary>
    [Authorize]
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<MediaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UploadMedia(
        IFormFile file,
        [FromForm] MediaType mediaType = MediaType.General,
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
        {
            throw new BadRequestException("No file was uploaded or file is empty.");
        }

        await using var stream = file.OpenReadStream();

        var command = new UploadMediaCommand(
            Stream: stream,
            OriginalFileName: file.FileName,
            DeclaredContentType: file.ContentType,
            FileSize: file.Length,
            MediaType: mediaType
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<MediaDto>.SuccessResult(result, "Media uploaded successfully."));
    }

    /// <summary>
    /// Get fresh Presigned Download URL for a media file (15-minute validity after ownership check).
    /// </summary>
    [Authorize]
    [HttpGet("{id}/download-url")]
    [ProducesResponseType(typeof(ApiResponse<MediaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDownloadUrl(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await HandleGetMediaUrl(id, cancellationToken);
    }

    /// <summary>
    /// Soft delete media record in database and delete physical object from Cloudflare R2 storage.
    /// </summary>
    [Authorize]
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteMedia(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var command = new DeleteMediaCommand(
            MediaId: id
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.SuccessResult(result, "Media deleted successfully."));
    }

    private async Task<IActionResult> HandleGetMediaUrl(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetMediaUrlQuery(
            MediaId: id
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<MediaDto>.SuccessResult(result, "Media access URL retrieved successfully."));
    }
}
