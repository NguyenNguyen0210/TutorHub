using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Media.DeleteMedia;

public class DeleteMediaCommandHandler : IRequestHandler<DeleteMediaCommand, bool>
{
    private readonly IAppDbContext _context;
    private readonly IObjectStorageService _storageService;

    public DeleteMediaCommandHandler(IAppDbContext context, IObjectStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
    }

    public async Task<bool> Handle(DeleteMediaCommand request, CancellationToken cancellationToken)
    {
        var media = await _context.Media
            .FirstOrDefaultAsync(m => m.Id == request.MediaId && m.Status == MediaStatus.Active, cancellationToken);

        if (media == null)
        {
            throw new NotFoundException("Media", request.MediaId);
        }

        // 1. Ownership Authorization Check
        var isOwner = media.UploadedByUserId == request.UserId;
        var isAdmin = request.UserRole == UserRole.Admin;

        if (!isOwner && !isAdmin)
        {
            throw new ForbiddenException("You do not have permission to delete this media file.");
        }

        // 2. Soft-delete in Database
        media.Status = MediaStatus.Deleted;
        media.DeletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // 3. Delete Physical Object from S3 Storage
        await _storageService.DeleteAsync(media.ObjectKey, cancellationToken);

        return true;
    }
}
