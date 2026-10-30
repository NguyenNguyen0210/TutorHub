using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wishlist.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wishlist.ToggleWishlist;

public class ToggleWishlistCommandHandler : IRequestHandler<ToggleWishlistCommand, WishlistToggleResultDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ToggleWishlistCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<WishlistToggleResultDto> Handle(ToggleWishlistCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var currentUserId = _currentUserService.UserId.Value;

        if (request.ItemType == WishlistItemType.Tutor)
        {
            var tutor = await _context.TutorProfiles
                .FirstOrDefaultAsync(t => t.Id == request.ItemId, cancellationToken);

            if (tutor == null)
            {
                throw new NotFoundException(nameof(TutorProfile), request.ItemId);
            }

            if (tutor.UserId == currentUserId)
            {
                throw new BadRequestException("Bạn không thể lưu chính hồ sơ gia sư của mình.");
            }

            var existing = await _context.WishlistItems
                .FirstOrDefaultAsync(w => w.UserId == currentUserId && w.TutorProfileId == request.ItemId, cancellationToken);

            if (existing != null)
            {
                _context.WishlistItems.Remove(existing);
                await _context.SaveChangesAsync(cancellationToken);
                return new WishlistToggleResultDto(false, "Đã bỏ lưu gia sư.");
            }

            var newItem = new WishlistItem
            {
                Id = Guid.NewGuid(),
                UserId = currentUserId,
                ItemType = WishlistItemType.Tutor,
                TutorProfileId = request.ItemId,
                CreatedAt = DateTime.UtcNow
            };

            _context.WishlistItems.Add(newItem);
            await _context.SaveChangesAsync(cancellationToken);
            return new WishlistToggleResultDto(true, "Đã lưu gia sư vào danh sách yêu thích.");
        }
        else if (request.ItemType == WishlistItemType.Service)
        {
            var service = await _context.Services
                .FirstOrDefaultAsync(s => s.Id == request.ItemId, cancellationToken);

            if (service == null)
            {
                throw new NotFoundException(nameof(Service), request.ItemId);
            }

            var existing = await _context.WishlistItems
                .FirstOrDefaultAsync(w => w.UserId == currentUserId && w.ServiceId == request.ItemId, cancellationToken);

            if (existing != null)
            {
                _context.WishlistItems.Remove(existing);
                await _context.SaveChangesAsync(cancellationToken);
                return new WishlistToggleResultDto(false, "Đã bỏ lưu dịch vụ.");
            }

            var newItem = new WishlistItem
            {
                Id = Guid.NewGuid(),
                UserId = currentUserId,
                ItemType = WishlistItemType.Service,
                ServiceId = request.ItemId,
                CreatedAt = DateTime.UtcNow
            };

            _context.WishlistItems.Add(newItem);
            await _context.SaveChangesAsync(cancellationToken);
            return new WishlistToggleResultDto(true, "Đã lưu dịch vụ vào danh sách yêu thích.");
        }

        throw new BadRequestException("Loại mục lưu không hợp lệ.");
    }
}
