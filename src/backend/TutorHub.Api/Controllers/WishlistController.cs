using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Wishlist.DTOs;
using TutorHub.Application.Features.Wishlist.GetWishlistIds;
using TutorHub.Application.Features.Wishlist.GetWishlistItems;
using TutorHub.Application.Features.Wishlist.RemoveWishlistItem;
using TutorHub.Application.Features.Wishlist.ToggleWishlist;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/wishlist")]
public class WishlistController : ControllerBase
{
    private readonly ISender _sender;

    public WishlistController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Toggle favorite status of a tutor or service.
    /// </summary>
    [HttpPost("toggle")]
    [ProducesResponseType(typeof(ApiResponse<WishlistToggleResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Toggle([FromBody] ToggleWishlistCommand command, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<WishlistToggleResultDto>.SuccessResult(result, result.Message));
    }

    /// <summary>
    /// Get lightweight list of all favorited tutor and service IDs for instant UI hydration.
    /// </summary>
    [HttpGet("ids")]
    [ProducesResponseType(typeof(ApiResponse<WishlistIdsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetWishlistIds(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetWishlistIdsQuery(), cancellationToken);
        return Ok(ApiResponse<WishlistIdsDto>.SuccessResult(result));
    }

    /// <summary>
    /// Get detailed paginated list of favorited tutors or services.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<object>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetWishlistItems(
        [FromQuery] WishlistItemType type,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetWishlistItemsQuery(type, page, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<object>>.SuccessResult(result));
    }

    /// <summary>
    /// Remove an item directly from the wishlist.
    /// </summary>
    [HttpDelete("{itemType}/{itemId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Remove(
        [FromRoute] WishlistItemType itemType,
        [FromRoute] Guid itemId,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new RemoveWishlistItemCommand(itemType, itemId), cancellationToken);
        return Ok(ApiResponse<bool>.SuccessResult(result, result ? "Đã xóa khỏi danh sách yêu thích." : "Mục không tồn tại."));
    }
}
