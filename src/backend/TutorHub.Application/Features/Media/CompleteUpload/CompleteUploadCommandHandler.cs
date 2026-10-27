using MediatR;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Files;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Features.Media.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.CompleteUpload;

public class CompleteUploadCommandHandler : IRequestHandler<CompleteUploadCommand, MediaDto>
{
    private readonly IAppDbContext _dbContext;
    private readonly IClock _clock;
    private readonly IObjectStorageService _storageService;
    private readonly ICurrentUserService _currentUserService;

    public CompleteUploadCommandHandler(
        IAppDbContext dbContext, IClock clock,
        IObjectStorageService storageService,
        ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _clock = clock;
        _storageService = storageService;
        _currentUserService = currentUserService;
    }

    public async Task<MediaDto> Handle(CompleteUploadCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();
        var role = _currentUserService.Role;

        if (request.MediaType == MediaType.Certificate && role is not UserRole.Tutor and not UserRole.Admin)
        {
            throw new ForbiddenException("You do not have permission to upload certificates. Only Tutors and Admins can upload certificates.");
        }

        var expectedPrefix = request.MediaType switch
        {
            MediaType.Avatar => $"profiles/{userId}/",
            MediaType.Certificate => $"tutors/{userId}/",
            MediaType.DisputeEvidence => $"reports/{userId}/",
            _ => $"general/{userId}/"
        };

        if (!request.ObjectKey.StartsWith(expectedPrefix, StringComparison.OrdinalIgnoreCase))
        {
            throw new ForbiddenException("Object storage key does not match the authenticated user partition.");
        }

        // Read actual object metadata; the completion request is untrusted.
        var stored = await _storageService.GetMetadataAsync(request.ObjectKey, cancellationToken);
        if (stored == null)
        {
            throw new NotFoundException("File was not found in object storage. Please ensure direct upload succeeded.");
        }

        var maxBytes = request.MediaType == MediaType.Avatar
            ? UploadLimits.MediaAvatarMaxBytes
            : UploadLimits.MediaPresignedMaxBytes;
        var extension = Path.GetExtension(request.ObjectKey);
        if (stored.Size <= 0 || stored.Size > maxBytes || stored.Size != request.FileSize ||
            !UploadLimits.MediaExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase) ||
            !string.Equals(extension, Path.GetExtension(request.OriginalFileName), StringComparison.OrdinalIgnoreCase) ||
            !UploadLimits.MediaMimeTypes.Contains(stored.ContentType, StringComparer.OrdinalIgnoreCase) ||
            !string.Equals(stored.ContentType, request.ContentType, StringComparison.OrdinalIgnoreCase))
        {
            throw new BadRequestException("Uploaded file size, extension, or content type is invalid.");
        }

        await using (var stream = await _storageService.DownloadAsync(request.ObjectKey, cancellationToken))
        {
            var header = new byte[12];
            var read = await stream.ReadAtLeastAsync(header, header.Length, throwOnEndOfStream: false, cancellationToken: cancellationToken);
            using var headerStream = new MemoryStream(header, 0, read, writable: false);
            if (!FileSignatureValidator.IsValidSignature(headerStream, extension, out var detectedMime) ||
                !string.Equals(detectedMime, stored.ContentType, StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("Uploaded file content does not match its declared type.");
            }
        }

        var isPrivate = request.MediaType != MediaType.Avatar;

        // 2. Persist Media record in database
        var media = new Domain.Entities.Media
        {
            Id = Guid.NewGuid(),
            ObjectKey = request.ObjectKey,
            OriginalFileName = request.OriginalFileName,
            ContentType = stored.ContentType,
            FileSize = stored.Size,
            StorageProvider = _storageService.Provider,
            MediaType = request.MediaType,
            IsPrivate = isPrivate,
            Status = MediaStatus.Active,
            UploadedByUserId = userId,
            CreatedAt = _clock.UtcNow
        };

        _dbContext.Media.Add(media);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // 3. Generate initial short-lived access URL
        var accessUrl = await _storageService.GenerateDownloadUrlAsync(
            request.ObjectKey,
            TimeSpan.FromMinutes(15),
            cancellationToken
        );

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
