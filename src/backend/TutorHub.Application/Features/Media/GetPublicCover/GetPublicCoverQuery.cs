using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.GetPublicCover;

public record GetPublicCoverQuery(Guid MediaId) : IRequest<string>;

public class GetPublicCoverQueryHandler(IAppDbContext context, IObjectStorageService storage)
    : IRequestHandler<GetPublicCoverQuery, string>
{
    public async Task<string> Handle(GetPublicCoverQuery request, CancellationToken cancellationToken)
    {
        var media = await context.Media.AsNoTracking().FirstOrDefaultAsync(m => m.Id == request.MediaId && m.MediaType == MediaType.ServiceCover && !m.IsPrivate && m.Status == MediaStatus.Active, cancellationToken);
        if (media == null || media.ContentType is not ("image/jpeg" or "image/png" or "image/webp"))
            throw new NotFoundException("Service cover", request.MediaId);
        return await storage.GenerateDownloadUrlAsync(media.ObjectKey, TimeSpan.FromMinutes(15), cancellationToken);
    }
}
