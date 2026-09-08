using FluentValidation;

namespace TutorHub.Application.Features.Sessions.CancelSession;

public class CancelSessionCommandValidator : AbstractValidator<CancelSessionCommand>
{
    public CancelSessionCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.SessionId).NotEmpty();
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Cancellation reason is required.")
            .MaximumLength(500).WithMessage("Cancellation reason cannot exceed 500 characters.");
    }
}
