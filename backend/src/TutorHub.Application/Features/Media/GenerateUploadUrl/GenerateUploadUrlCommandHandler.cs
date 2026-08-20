using MediatR;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Media.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.GenerateUploadUrl;

public class GenerateUploadUrlCommandHandler : IRequestHandler<GenerateUploadUrlCommand, UploadUrlDto>
{
    private readonly IObjectStorageService _storageService;

    public GenerateUploadUrlCommandHandler(IObjectStorageService storageService)
    {
        _storageService = storageService;
    }

    public async Task<UploadUrlDto> Handle(GenerateUploadUrlCommand request, CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(request.FileName).ToLowerInvariant();
        var uniqueId = Guid.NewGuid().ToString("N");
        var now = DateTime.UtcNow;

        var objectKey = request.MediaType switch
        {
            MediaType.Avatar => $"profiles/{request.UserId}/avatar/{uniqueId}{extension}",
            MediaType.Certificate => $"tutors/{request.UserId}/documents/{uniqueId}{extension}",
            MediaType.DisputeEvidence => $"reports/{request.UserId}/attachments/{uniqueId}{extension}",
            _ => $"general/{request.UserId}/{now:yyyy}/{now:MM}/{uniqueId}{extension}"
        };

        const int expirationMinutes = 15;
        var uploadUrl = await _storageService.GenerateUploadUrlAsync(
            objectKey,
            request.ContentType,
            TimeSpan.FromMinutes(expirationMinutes),
            cancellationToken
        );

        return new UploadUrlDto(
            UploadUrl: uploadUrl,
            ObjectKey: objectKey,
            ExpiresInMinutes: expirationMinutes
        );
    }
}
