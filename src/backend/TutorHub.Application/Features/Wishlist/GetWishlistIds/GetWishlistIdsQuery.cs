using MediatR;
using TutorHub.Application.Features.Wishlist.DTOs;

namespace TutorHub.Application.Features.Wishlist.GetWishlistIds;

public record GetWishlistIdsQuery : IRequest<WishlistIdsDto>;
