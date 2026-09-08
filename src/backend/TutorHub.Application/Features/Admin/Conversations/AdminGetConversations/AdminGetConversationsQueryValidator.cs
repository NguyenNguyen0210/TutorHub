using FluentValidation;

namespace TutorHub.Application.Features.Admin.Conversations.AdminGetConversations;

public class AdminGetConversationsQueryValidator : AbstractValidator<AdminGetConversationsQuery>
{
    public AdminGetConversationsQueryValidator()
    {
        RuleFor(x => x.OperationalReason)
            .NotEmpty()
            .MinimumLength(5)
            .WithMessage("OperationalReason is required and must be at least 5 characters.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50)
            .WithMessage("PageSize must be between 1 and 50.");
    }
}
