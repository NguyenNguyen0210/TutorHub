using MediatR;
using TutorHub.Application.Features.Conversations.DTOs;

namespace TutorHub.Application.Features.Conversations.SendMessage;

public record SendMessageCommand(
    Guid ConversationId,
    string Content,
    string? AttachmentKey = null,
    string? AttachmentName = null,
    string? AttachmentContentType = null,
    long? AttachmentSize = null
) : IRequest<MessageDto>;
