using MediatR;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Media.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.GenerateUploadUrl;

public class GenerateUploadUrlCommandHandler : IRequestHandler<GenerateUploadUrlCommand, UploadUrlDto>
{
    private readonly IObjectStorageService _storageService;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;

    public GenerateUploadUrlCommandHandler(IObjectStorageService storageService, IClock clock, ICurrentUserService currentUserService)
    {
        _storageService = storageService;
        _clock = clock;
        _currentUserService = currentUserService;
    }

    public async Task<UploadUrlDto> Handle(GenerateUploadUrlCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();
        var role = _currentUserService.Role;

        if (request.MediaType == MediaType.Certificate && role is not UserRole.Tutor and not UserRole.Admin)
        {
            throw new ForbiddenException("Only Tutors and Admins can upload certificates.");
        }

        var extension = Path.GetExtension(request.FileName).ToLowerInvariant();
        var uniqueId = Guid.NewGuid().ToString("N");
        var now = _clock.UtcNow;

        var objectKey = request.MediaType switch
        {
            MediaType.Avatar => $"profiles/{userId}/avatar/{uniqueId}{extension}",
            MediaType.Certificate => $"tutors/{userId}/documents/{uniqueId}{extension}",
            MediaType.DisputeEvidence => $"reports/{userId}/attachments/{uniqueId}{extension}",
            _ => $"general/{userId}/{now:yyyy}/{now:MM}/{uniqueId}{extension}"
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
