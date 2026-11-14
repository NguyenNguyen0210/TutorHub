using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Notifications;

namespace TutorHub.Application.Features.Notifications.GetUnreadNotificationCount;

public record GetUnreadNotificationCountQuery : IRequest<int>;

public class GetUnreadNotificationCountQueryHandler : IRequestHandler<GetUnreadNotificationCountQuery, int>
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public GetUnreadNotificationCountQueryHandler(
        IAppDbContext dbContext,
        ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task<int> Handle(GetUnreadNotificationCountQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || !_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var currentUserId = _currentUserService.UserId.Value;

        return await _dbContext.Notifications
            .AsNoTracking()
            .VisibleToUser(currentUserId)
            .CountAsync(n => !n.IsRead, cancellationToken);
    }
}
