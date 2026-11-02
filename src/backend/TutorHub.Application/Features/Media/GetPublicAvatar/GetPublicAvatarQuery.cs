using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Storage;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.GetPublicAvatar;

public record GetPublicAvatarQuery(Guid MediaId) : IRequest<string>;

public class GetPublicAvatarQueryHandler(IAppDbContext context, IObjectStorageService storage)
    : IRequestHandler<GetPublicAvatarQuery, string>
{
    public async Task<string> Handle(GetPublicAvatarQuery request, CancellationToken cancellationToken)
    {
        var media = await context.Media.AsNoTracking().FirstOrDefaultAsync(m =>
            m.Id == request.MediaId && m.MediaType == MediaType.Avatar &&
            !m.IsPrivate && m.Status == MediaStatus.Active, cancellationToken);
        if (media is null) throw new NotFoundException("Avatar", request.MediaId);
        return await storage.GenerateDownloadUrlAsync(media.ObjectKey, TimeSpan.FromMinutes(15), cancellationToken);
    }
}
