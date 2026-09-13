using FluentValidation;

namespace TutorHub.Application.Features.Disputes.Commands.CreateDispute;

public class CreateDisputeCommandValidator : AbstractValidator<CreateDisputeCommand>
{
    public CreateDisputeCommandValidator()
    {
        RuleFor(x => x.SessionId)
            .NotEmpty().WithMessage("Session ID is required.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required.")
            .MinimumLength(20).WithMessage("Description must be at least 20 characters to prevent spam disputes.")
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters.");
    }
}
