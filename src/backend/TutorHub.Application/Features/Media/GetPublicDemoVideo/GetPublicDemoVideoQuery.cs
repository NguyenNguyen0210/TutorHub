using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.GetPublicDemoVideo;

public record GetPublicDemoVideoQuery(Guid MediaId) : IRequest<string>;

/// <summary>
/// Public playback URL for a service demo video. Only publicly playable
/// <see cref="MediaType.ServiceDemoVideo"/> records resolve; every other media
/// type stays behind the authenticated download endpoint.
/// </summary>
public class GetPublicDemoVideoQueryHandler(IAppDbContext context, IObjectStorageService storage)
    : IRequestHandler<GetPublicDemoVideoQuery, string>
{
    // Long enough for a demo clip to play to the end (and to be scrubbed)
    // without the signed URL expiring mid-playback.
    private static readonly TimeSpan PlaybackUrlLifetime = TimeSpan.FromMinutes(60);

    public async Task<string> Handle(GetPublicDemoVideoQuery request, CancellationToken cancellationToken)
    {
        var media = await context.Media
            .AsNoTracking()
            .FirstOrDefaultAsync(
                m => m.Id == request.MediaId &&
                     m.MediaType == MediaType.ServiceDemoVideo &&
                     !m.IsPrivate &&
                     m.Status == MediaStatus.Active,
                cancellationToken);

        if (media == null || media.ContentType != "video/mp4")
        {
            throw new NotFoundException("Service demo video", request.MediaId);
        }

        return await storage.GenerateDownloadUrlAsync(media.ObjectKey, PlaybackUrlLifetime, cancellationToken);
    }
}
