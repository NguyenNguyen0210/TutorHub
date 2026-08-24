using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Media.DeleteMedia;
using TutorHub.Application.Features.Media.DTOs;
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
    /// Upload a file or image to AWS S3 Cloud Storage with binary magic bytes validation.
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

        var userId = GetCurrentUserId();
        var userRole = GetCurrentUserRole();

        await using var stream = file.OpenReadStream();

        var command = new UploadMediaCommand(
            Stream: stream,
            OriginalFileName: file.FileName,
            DeclaredContentType: file.ContentType,
            FileSize: file.Length,
            MediaType: mediaType,
            UserId: userId,
            UserRole: userRole
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<MediaDto>.SuccessResult(result, "Media uploaded successfully."));
    }

    /// <summary>
    /// Get fresh access URL for a media file (returns Pre-signed URL for private files or CDN URL for public files).
    /// </summary>
    [Authorize]
    [HttpGet("{id}/url")]
    [ProducesResponseType(typeof(ApiResponse<MediaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMediaUrl(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var userRole = GetCurrentUserRole();

        var query = new GetMediaUrlQuery(
            MediaId: id,
            UserId: userId,
            UserRole: userRole
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<MediaDto>.SuccessResult(result, "Media access URL retrieved successfully."));
    }

    /// <summary>
    /// Soft delete media record in database and delete physical object from AWS S3 storage.
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
        var userId = GetCurrentUserId();
        var userRole = GetCurrentUserRole();

        var command = new DeleteMediaCommand(
            MediaId: id,
            UserId: userId,
            UserRole: userRole
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.SuccessResult(result, "Media deleted successfully."));
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

    private UserRole GetCurrentUserRole()
    {
        var roleClaim = User.FindFirstValue(ClaimTypes.Role);
        if (Enum.TryParse<UserRole>(roleClaim, out var role))
        {
            return role;
        }
        return UserRole.Student;
    }
}
