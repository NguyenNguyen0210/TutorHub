using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wishlist.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wishlist.GetWishlistIds;

public class GetWishlistIdsQueryHandler : IRequestHandler<GetWishlistIdsQuery, WishlistIdsDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetWishlistIdsQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<WishlistIdsDto> Handle(GetWishlistIdsQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var currentUserId = _currentUserService.UserId.Value;

        var items = await _context.WishlistItems
            .AsNoTracking()
            .Where(w => w.UserId == currentUserId)
            .Select(w => new { w.ItemType, w.TutorProfileId, w.ServiceId })
            .ToListAsync(cancellationToken);

        var tutorIds = items
            .Where(i => i.ItemType == WishlistItemType.Tutor && i.TutorProfileId.HasValue)
            .Select(i => i.TutorProfileId!.Value)
            .ToList();

        var serviceIds = items
            .Where(i => i.ItemType == WishlistItemType.Service && i.ServiceId.HasValue)
            .Select(i => i.ServiceId!.Value)
            .ToList();

        return new WishlistIdsDto(tutorIds, serviceIds);
    }
}
