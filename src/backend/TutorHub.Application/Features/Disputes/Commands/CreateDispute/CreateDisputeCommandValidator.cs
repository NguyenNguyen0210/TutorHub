using FluentValidation;

namespace TutorHub.Application.Features.Disputes.Commands.CreateDispute;

public class CreateDisputeCommandValidator : AbstractValidator<CreateDisputeCommand>
{
    public CreateDisputeCommandValidator()
    {
        RuleFor(x => x.SessionId)
            .NotEmpty().WithMessage("Session ID is required.");

        RuleFor(x => x.InitiatorUserId)
            .NotEmpty().WithMessage("Initiator user ID is required.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required.")
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters.");
    }
}
