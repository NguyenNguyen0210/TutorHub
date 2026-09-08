using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Notifications.GetMyNotifications;
using TutorHub.Application.Features.Notifications.GetUnreadNotificationCount;
using TutorHub.Application.Features.Notifications.MarkAllNotificationsAsRead;
using TutorHub.Application.Features.Notifications.MarkNotificationAsRead;

namespace TutorHub.Api.Controllers;

[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public NotificationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyNotifications(
        [FromQuery] bool? unreadOnly,
        [FromQuery] string? cursor,
        [FromQuery] int pageSize = 20)
    {
        var query = new GetMyNotificationsQuery(unreadOnly, cursor, pageSize);
        var result = await _mediator.Send(query);
        return Ok(ApiResponse<object>.SuccessResult(result, "Notifications retrieved successfully."));
    }

    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetUnreadCount()
    {
        var query = new GetUnreadNotificationCountQuery();
        var count = await _mediator.Send(query);
        return Ok(ApiResponse<object>.SuccessResult(new { unreadCount = count }, "Unread count retrieved successfully."));
    }

    [HttpPatch("{id:guid}/read")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var command = new MarkNotificationAsReadCommand(id);
        var result = await _mediator.Send(command);
        return Ok(ApiResponse<object>.SuccessResult(new { success = result }, "Notification marked as read."));
    }

    [HttpPatch("read-all")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var command = new MarkAllNotificationsAsReadCommand();
        var count = await _mediator.Send(command);
        return Ok(ApiResponse<object>.SuccessResult(new { markedCount = count }, "All notifications marked as read."));
    }
}
