using MediatR;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wishlist.RemoveWishlistItem;

public record RemoveWishlistItemCommand(WishlistItemType ItemType, Guid ItemId) : IRequest<bool>;
