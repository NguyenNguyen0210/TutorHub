using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Conversations.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Conversations.SendMessage;

public class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, MessageDto>
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IChatNotificationService? _chatNotificationService;

    public SendMessageCommandHandler(
        IAppDbContext dbContext,
        ICurrentUserService currentUserService,
        IChatNotificationService? chatNotificationService = null)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _chatNotificationService = chatNotificationService;
    }

    public async Task<MessageDto> Handle(SendMessageCommand request, CancellationToken cancellationToken)
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
            throw new NotFoundException("Conversation", request.ConversationId);
        }

        // Participant check
        var isStudent = conversation.StudentProfile != null && conversation.StudentProfile.UserId == currentUserId;
        var isTutor = conversation.TutorProfile != null && conversation.TutorProfile.UserId == currentUserId;

        if (!isStudent && !isTutor)
        {
            throw new ForbiddenException("Only conversation participants can send messages.");
        }

        var recipientUserId = isStudent ? conversation.TutorProfile!.UserId : conversation.StudentProfile!.UserId;

        var message = new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = conversation.Id,
            SenderUserId = currentUserId,
            Content = request.Content?.Trim() ?? string.Empty,
            AttachmentKey = request.AttachmentKey,
            AttachmentName = request.AttachmentName,
            AttachmentContentType = request.AttachmentContentType,
            AttachmentSize = request.AttachmentSize,
            CreatedAt = DateTime.UtcNow
        };

        var preview = !string.IsNullOrWhiteSpace(message.Content) 
            ? message.Content 
            : (!string.IsNullOrWhiteSpace(message.AttachmentName) ? $"[Attachment: {message.AttachmentName}]" : string.Empty);
        conversation.UpdateLastMessage(message.Id, preview, message.CreatedAt);

        _dbContext.Messages.Add(message);

        // Enqueue MessageSent Outbox message in same DB transaction (DEC-S7-001, DEC-S7-002)
        _dbContext.OutboxMessages.Add(new OutboxMessage
        {
            Id = Guid.NewGuid(),
            EventId = Guid.NewGuid(),
            EventType = BusinessEventTypes.MessageSent,
            EventVersion = 1,
            AggregateType = "Conversation",
            AggregateId = conversation.Id,
            Payload = JsonSerializer.Serialize(new
            {
                ConversationId = conversation.Id,
                MessageId = message.Id,
                SenderUserId = currentUserId,
                RecipientUserId = recipientUserId,
                Preview = preview
            }),
            OccurredAt = message.CreatedAt,
            CreatedAt = DateTime.UtcNow,
            Status = OutboxMessageStatus.Pending
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

        var senderUser = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == currentUserId, cancellationToken);

        var messageDto = new MessageDto
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            SenderUserId = currentUserId,
            SenderName = senderUser?.FullName ?? string.Empty,
            SenderAvatarUrl = senderUser?.AvatarUrl,
            Content = message.Content,
            AttachmentKey = message.AttachmentKey,
            AttachmentName = message.AttachmentName,
            AttachmentContentType = message.AttachmentContentType,
            AttachmentSize = message.AttachmentSize,
            IsRead = false,
            ReadAt = null,
            CreatedAt = message.CreatedAt
        };

        // Best-effort SignalR realtime push post-commit (INV-EVENT-016)
        if (_chatNotificationService != null)
        {
            await _chatNotificationService.SendMessageRealtimeAsync(conversation.Id, messageDto, cancellationToken);
        }

        return messageDto;
    }
}
