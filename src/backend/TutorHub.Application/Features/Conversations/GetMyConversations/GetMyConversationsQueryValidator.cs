using FluentValidation;

namespace TutorHub.Application.Features.Conversations.GetMyConversations;

public class GetMyConversationsQueryValidator : AbstractValidator<GetMyConversationsQuery>
{
    public GetMyConversationsQueryValidator()
    {
        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50)
            .WithMessage("PageSize must be between 1 and 50.");
    }
}
