using MediatR;
using TutorHub.Application.Features.Conversations.DTOs;

namespace TutorHub.Application.Features.Conversations.GetOrCreateConversation;

public record GetOrCreateConversationCommand(
    Guid TargetUserId
) : IRequest<ConversationDto>;
