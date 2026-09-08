using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Application.Features.Conversations.MarkConversationAsRead;

public class MarkConversationAsReadCommandHandler : IRequestHandler<MarkConversationAsReadCommand, int>
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IChatNotificationService? _chatNotificationService;

    public MarkConversationAsReadCommandHandler(
        IAppDbContext dbContext,
        ICurrentUserService currentUserService,
        IChatNotificationService? chatNotificationService = null)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _chatNotificationService = chatNotificationService;
    }

    public async Task<int> Handle(MarkConversationAsReadCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || !_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var currentUserId = _currentUserService.UserId.Value;

        var conversation = await _dbContext.Conversations
            .Include(c => c.StudentProfile)
            .Include(c => c.TutorProfile)
            .FirstOrDefaultAsync(c => c.Id == request.ConversationId, cancellationToken);

        if (conversation == null)
        {
            throw new NotFoundException($"Conversation with ID '{request.ConversationId}' not found.");
        }

        var isStudent = conversation.StudentProfile != null && conversation.StudentProfile.UserId == currentUserId;
        var isTutor = conversation.TutorProfile != null && conversation.TutorProfile.UserId == currentUserId;

        if (!isStudent && !isTutor)
        {
            throw new ForbiddenException("You are not authorized to access this conversation.");
        }

        var now = DateTime.UtcNow;

        var unreadMessages = await _dbContext.Messages
            .Where(m => m.ConversationId == request.ConversationId && m.SenderUserId != currentUserId && !m.IsRead)
            .ToListAsync(cancellationToken);

        if (unreadMessages.Count == 0)
        {
            return 0;
        }

        foreach (var message in unreadMessages)
        {
            message.MarkAsRead(now);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Best-effort SignalR realtime read receipt post-commit (INV-EVENT-016)
        if (_chatNotificationService != null && unreadMessages.Count > 0)
        {
            var lastReadMessage = unreadMessages.OrderByDescending(m => m.CreatedAt).First();
            await _chatNotificationService.SendMessageReadRealtimeAsync(
                conversation.Id,
                lastReadMessage.Id,
                currentUserId,
                cancellationToken);
        }

        return unreadMessages.Count;
    }
}
