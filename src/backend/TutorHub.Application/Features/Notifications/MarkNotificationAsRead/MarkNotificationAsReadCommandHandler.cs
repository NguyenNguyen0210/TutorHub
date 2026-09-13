using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Application.Features.Notifications.MarkNotificationAsRead;

public class MarkNotificationAsReadCommandHandler : IRequestHandler<MarkNotificationAsReadCommand, bool>
{
    private readonly IAppDbContext _dbContext;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;

    public MarkNotificationAsReadCommandHandler(
        IAppDbContext dbContext, IClock clock,
        ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _clock = clock;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(MarkNotificationAsReadCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || !_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var currentUserId = _currentUserService.UserId.Value;

        var notification = await _dbContext.Notifications
            .FirstOrDefaultAsync(n => n.Id == request.NotificationId, cancellationToken);

        if (notification == null)
        {
            throw new NotFoundException("Notification", request.NotificationId);
        }

        if (notification.UserId != currentUserId)
        {
            throw new ForbiddenException("You cannot mark another user's notification as read.");
        }

        notification.MarkAsRead(_clock.UtcNow);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
