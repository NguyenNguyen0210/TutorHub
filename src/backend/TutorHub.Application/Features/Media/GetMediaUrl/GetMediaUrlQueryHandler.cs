using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Media.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.GetMediaUrl;

public class GetMediaUrlQueryHandler : IRequestHandler<GetMediaUrlQuery, MediaDto>
{
    private readonly IAppDbContext _context;
    private readonly IObjectStorageService _storageService;
    private readonly ICurrentUserService _currentUserService;

    public GetMediaUrlQueryHandler(IAppDbContext context, IObjectStorageService storageService, ICurrentUserService currentUserService)
    {
        _context = context;
        _storageService = storageService;
        _currentUserService = currentUserService;
    }

    public async Task<MediaDto> Handle(GetMediaUrlQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();
        var role = _currentUserService.Role;

        var media = await _context.Media
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == request.MediaId && m.Status == MediaStatus.Active, cancellationToken);

        if (media == null)
        {
            throw new NotFoundException("Media", request.MediaId);
        }

        // 1. Authorization Ownership Check on Private Files
        if (media.IsPrivate)
        {
            var isOwner = media.UploadedByUserId == userId;
            var isAdmin = role == UserRole.Admin;

            if (!isOwner && !isAdmin)
            {
                throw new ForbiddenException("You do not have permission to view or download this private file.");
            }
        }

        // 2. Generate short-lived access URL
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
