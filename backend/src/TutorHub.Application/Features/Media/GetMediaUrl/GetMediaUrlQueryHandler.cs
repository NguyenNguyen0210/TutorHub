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

    public GetMediaUrlQueryHandler(IAppDbContext context, IObjectStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
    }

    public async Task<MediaDto> Handle(GetMediaUrlQuery request, CancellationToken cancellationToken)
    {
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
            var isOwner = media.UploadedByUserId == request.UserId;
            var isAdmin = request.UserRole == UserRole.Admin;

            if (!isOwner && !isAdmin)
            {
                throw new ForbiddenException("You do not have permission to view or download this private file.");
            }
        }

        // 2. Generate Access URL (Presigned 15 minutes)
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
