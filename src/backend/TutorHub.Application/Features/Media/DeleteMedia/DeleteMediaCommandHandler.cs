using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.DeleteMedia;

public class DeleteMediaCommandHandler : IRequestHandler<DeleteMediaCommand, bool>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly IObjectStorageService _storageService;
    private readonly ICurrentUserService _currentUserService;

    public DeleteMediaCommandHandler(IAppDbContext context, IClock clock, IObjectStorageService storageService, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _storageService = storageService;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(DeleteMediaCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();
        var role = _currentUserService.Role;

        var media = await _context.Media
            .FirstOrDefaultAsync(m => m.Id == request.MediaId && m.Status == MediaStatus.Active, cancellationToken);

        if (media == null)
        {
            throw new NotFoundException("Media", request.MediaId);
        }

        // 1. Ownership Authorization Check
        var isOwner = media.UploadedByUserId == userId;
        var isAdmin = role == UserRole.Admin;

        if (!isOwner && !isAdmin)
        {
            throw new ForbiddenException("You do not have permission to delete this media file.");
        }

        // 2. Soft-delete in Database
        media.Status = MediaStatus.Deleted;
        media.DeletedAt = _clock.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // 3. Delete physical object in object storage
        await _storageService.DeleteAsync(media.ObjectKey, cancellationToken);

        return true;
    }
}
