using FluentValidation;

namespace TutorHub.Application.Features.Admin.Conversations.AdminGetConversationMessages;

public class AdminGetConversationMessagesQueryValidator : AbstractValidator<AdminGetConversationMessagesQuery>
{
    public AdminGetConversationMessagesQueryValidator()
    {
        RuleFor(x => x.ConversationId)
            .NotEmpty()
            .WithMessage("ConversationId is required.");

        RuleFor(x => x.OperationalReason)
            .NotEmpty()
            .MinimumLength(5)
            .WithMessage("OperationalReason is required and must be at least 5 characters.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("PageSize must be between 1 and 100.");
    }
}
