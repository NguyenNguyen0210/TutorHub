using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wishlist.RemoveWishlistItem;

public class RemoveWishlistItemCommandHandler : IRequestHandler<RemoveWishlistItemCommand, bool>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public RemoveWishlistItemCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(RemoveWishlistItemCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var currentUserId = _currentUserService.UserId.Value;

        var item = await _context.WishlistItems
            .FirstOrDefaultAsync(w => w.UserId == currentUserId &&
                ((request.ItemType == WishlistItemType.Tutor && w.TutorProfileId == request.ItemId) ||
                 (request.ItemType == WishlistItemType.Service && w.ServiceId == request.ItemId)),
                cancellationToken);

        if (item == null) return false;

        _context.WishlistItems.Remove(item);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
