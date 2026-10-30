using MediatR;
using TutorHub.Application.Features.Wishlist.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wishlist.ToggleWishlist;

public record ToggleWishlistCommand(WishlistItemType ItemType, Guid ItemId) : IRequest<WishlistToggleResultDto>;
