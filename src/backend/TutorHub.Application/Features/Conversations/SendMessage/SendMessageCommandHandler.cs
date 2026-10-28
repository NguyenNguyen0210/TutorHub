using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Conversations.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Application.Common.Concurrency;

namespace TutorHub.Application.Features.Conversations.SendMessage;

public class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, MessageDto>
{
    private readonly IAppDbContext _dbContext;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;
    private readonly IChatNotificationService? _chatNotificationService;

    public SendMessageCommandHandler(
        IAppDbContext dbContext, IClock clock,
        ICurrentUserService currentUserService,
        IChatNotificationService? chatNotificationService = null)
    {
        _dbContext = dbContext;
        _clock = clock;
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

        await using var transaction = await PostgresAdvisoryLock.BeginTransactionAsync(_dbContext, cancellationToken);

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

        ConversationAttachment? attachment = null;
        if (!string.IsNullOrWhiteSpace(request.AttachmentKey))
        {
            attachment = await _dbContext.ConversationAttachments.AsNoTracking()
                .FirstOrDefaultAsync(a => a.StorageKey == request.AttachmentKey &&
                    a.ConversationId == conversation.Id && a.UploadedByUserId == currentUserId,
                    cancellationToken);
            if (attachment == null)
                throw new ForbiddenException("Attachment was not uploaded to this conversation by you.");
        }

        var message = new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = conversation.Id,
            SenderUserId = currentUserId,
            Content = request.Content?.Trim() ?? string.Empty,
            AttachmentKey = attachment?.StorageKey,
            AttachmentName = attachment?.FileName,
            AttachmentContentType = attachment?.ContentType,
            AttachmentSize = attachment?.Size,
            CreatedAt = _clock.UtcNow
        };

        var preview = !string.IsNullOrWhiteSpace(message.Content)
            ? message.Content
            : (!string.IsNullOrWhiteSpace(message.AttachmentName) ? $"[Attachment: {message.AttachmentName}]" : string.Empty);
        var summaryPreview = preview.Length > 100 ? preview[..100] : preview;

        if (!PostgresAdvisoryLock.IsPostgres(_dbContext))
            conversation.UpdateLastMessage(message.Id, summaryPreview, message.CreatedAt);

        _dbContext.Messages.Add(message);

        await _dbContext.SaveChangesAsync(cancellationToken);
        await PostgresAdvisoryLock.LockRowAsync(_dbContext, $"""
            UPDATE "Conversations"
            SET "LastMessageId" = {message.Id},
                "LastMessageAt" = {message.CreatedAt},
                "LastMessagePreview" = {summaryPreview}
            WHERE "Id" = {conversation.Id}
              AND ("LastMessageAt" IS NULL
                   OR "LastMessageAt" < {message.CreatedAt}
                   OR ("LastMessageAt" = {message.CreatedAt}
                       AND ("LastMessageId" IS NULL OR "LastMessageId" < {message.Id})))
            """,
            cancellationToken);
        if (transaction != null)
            await transaction.CommitAsync(cancellationToken);

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

        // Best-effort SignalR realtime push post-commit
        if (_chatNotificationService != null)
        {
            await _chatNotificationService.SendMessageRealtimeAsync(conversation.Id, messageDto, cancellationToken);
        }

        return messageDto;
    }
}
