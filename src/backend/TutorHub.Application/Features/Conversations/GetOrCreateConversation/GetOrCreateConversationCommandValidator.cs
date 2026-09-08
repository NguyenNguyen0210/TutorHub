using FluentValidation;

namespace TutorHub.Application.Features.Conversations.GetOrCreateConversation;

public class GetOrCreateConversationCommandValidator : AbstractValidator<GetOrCreateConversationCommand>
{
    public GetOrCreateConversationCommandValidator()
    {
        RuleFor(x => x.TargetUserId)
            .NotEmpty()
            .WithMessage("TargetUserId is required.");
    }
}
