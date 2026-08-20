using MediatR;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Media.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.UploadMedia;

public class UploadMediaCommandHandler : IRequestHandler<UploadMediaCommand, MediaDto>
{
    private readonly IAppDbContext _context;
    private readonly IObjectStorageService _storageService;
    private readonly ILogger<UploadMediaCommandHandler> _logger;

    public UploadMediaCommandHandler(
        IAppDbContext context,
        IObjectStorageService storageService,
        ILogger<UploadMediaCommandHandler> logger)
    {
        _context = context;
        _storageService = storageService;
        _logger = logger;
    }

    public async Task<MediaDto> Handle(UploadMediaCommand request, CancellationToken cancellationToken)
    {
        var ext = Path.GetExtension(request.OriginalFileName).ToLowerInvariant();

        // 1. Deep Binary Magic Bytes Validation
        if (!FileSignatureValidator.IsValidSignature(request.Stream, ext, out var detectedMime))
        {
            throw new BadRequestException($"File binary signature does not match declared extension '{ext}' or contains invalid file header.");
        }

        // 2. Determine Privacy & Partitioned S3 ObjectKey
        var isPrivate = request.MediaType != MediaType.Avatar;
        var folder = request.MediaType switch
        {
            MediaType.Avatar => "profiles",
            MediaType.Certificate => "tutors",
            MediaType.DisputeEvidence => "reports",
            _ => "general"
        };

        var now = DateTime.UtcNow;
        var uniqueId = Guid.NewGuid().ToString("N");
        var storedFileName = $"{uniqueId}{ext}";
        var objectKey = request.MediaType switch
        {
            MediaType.Avatar => $"profiles/{request.UserId}/avatar/{storedFileName}",
            MediaType.Certificate => $"tutors/{request.UserId}/documents/{storedFileName}",
            MediaType.DisputeEvidence => $"reports/{request.UserId}/attachments/{storedFileName}",
            _ => $"general/{request.UserId}/{now:yyyy}/{now:MM}/{storedFileName}"
        };

        // 3. Upload to Cloudflare R2 Object Storage
        var storedResult = await _storageService.UploadAsync(
            stream: request.Stream,
            objectKey: objectKey,
            contentType: detectedMime,
            cancellationToken: cancellationToken
        );

        // 4. Save Media Entity in Database with Rollback Guard
        var media = new Domain.Entities.Media
        {
            Id = Guid.NewGuid(),
            ObjectKey = storedResult.ObjectKey,
            OriginalFileName = request.OriginalFileName,
            ContentType = detectedMime,
            FileSize = storedResult.Size,
            StorageProvider = StorageProvider.CloudflareR2,
            MediaType = request.MediaType,
            IsPrivate = isPrivate,
            Status = MediaStatus.Active,
            UploadedByUserId = request.UserId,
            CreatedAt = now
        };

        try
        {
            _context.Media.Add(media);
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist Media record in DB for ObjectKey={ObjectKey}. Rolling back R2 object.", objectKey);

            // Rollback orphan object on R2
            try
            {
                await _storageService.DeleteAsync(objectKey, CancellationToken.None);
            }
            catch (Exception rollbackEx)
            {
                _logger.LogError(rollbackEx, "Failed to rollback R2 object ObjectKey={ObjectKey}", objectKey);
            }

            throw;
        }

        // 5. Generate Presigned Access URL (15 minutes)
        var accessUrl = await _storageService.GenerateDownloadUrlAsync(media.ObjectKey, TimeSpan.FromMinutes(15), cancellationToken);

        return new MediaDto(
            Id: media.Id,
            ObjectKey: media.ObjectKey,
            OriginalFileName: media.OriginalFileName,
            FileSize: media.FileSize,
            ContentType: media.ContentType,
            MediaType: media.MediaType,
            IsPrivate: media.IsPrivate,
            AccessUrl: accessUrl,
            CreatedAt: media.CreatedAt
        );
    }
}
