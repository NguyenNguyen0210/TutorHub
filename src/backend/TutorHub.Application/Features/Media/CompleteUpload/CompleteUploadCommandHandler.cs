using MediatR;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Media.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.CompleteUpload;

public class CompleteUploadCommandHandler : IRequestHandler<CompleteUploadCommand, MediaDto>
{
    private readonly IAppDbContext _dbContext;
    private readonly IObjectStorageService _storageService;

    public CompleteUploadCommandHandler(
        IAppDbContext dbContext,
        IObjectStorageService storageService)
    {
        _dbContext = dbContext;
        _storageService = storageService;
    }

    public async Task<MediaDto> Handle(CompleteUploadCommand request, CancellationToken cancellationToken)
    {
        // 1. Verify object exists on Cloudflare R2 via HEAD check
        var exists = await _storageService.ExistsAsync(request.ObjectKey, cancellationToken);
        if (!exists)
        {
            throw new NotFoundException("File was not found in object storage. Please ensure direct upload succeeded.");
        }

        var isPrivate = request.MediaType != MediaType.Avatar;

        // 2. Persist Media record in database
        var media = new Domain.Entities.Media
        {
            Id = Guid.NewGuid(),
            ObjectKey = request.ObjectKey,
            OriginalFileName = request.OriginalFileName,
            ContentType = request.ContentType,
            FileSize = request.FileSize,
            StorageProvider = StorageProvider.CloudflareR2,
            MediaType = request.MediaType,
            IsPrivate = isPrivate,
            Status = MediaStatus.Active,
            UploadedByUserId = request.UserId,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Media.Add(media);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // 3. Generate initial access URL (Presigned 15 minutes)
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
