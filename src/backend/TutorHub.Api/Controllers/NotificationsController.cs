using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    public async Task<IActionResult> GetMyNotifications(
        [FromQuery] bool? unreadOnly,
        [FromQuery] string? cursor,
        [FromQuery] int pageSize = 20)
    {
        var query = new GetMyNotificationsQuery(unreadOnly, cursor, pageSize);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var query = new GetUnreadNotificationCountQuery();
        var count = await _mediator.Send(query);
        return Ok(new { unreadCount = count });
    }

    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var command = new MarkNotificationAsReadCommand(id);
        var result = await _mediator.Send(command);
        return Ok(new { success = result });
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var command = new MarkAllNotificationsAsReadCommand();
        var count = await _mediator.Send(command);
        return Ok(new { markedCount = count });
    }
}
