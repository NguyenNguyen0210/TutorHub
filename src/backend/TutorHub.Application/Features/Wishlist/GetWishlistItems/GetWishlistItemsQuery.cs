using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wishlist.GetWishlistItems;

public record GetWishlistItemsQuery(
    WishlistItemType Type,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PagedResult<object>>;
