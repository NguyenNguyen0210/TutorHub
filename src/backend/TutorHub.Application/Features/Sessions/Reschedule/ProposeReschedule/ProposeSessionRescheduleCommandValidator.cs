using FluentValidation;

namespace TutorHub.Application.Features.Sessions.Reschedule.ProposeReschedule;

public class ProposeSessionRescheduleCommandValidator : AbstractValidator<ProposeSessionRescheduleCommand>
{
    public ProposeSessionRescheduleCommandValidator()
    {
        RuleFor(x => x.SessionId)
            .NotEmpty().WithMessage("SessionId is required.");

        RuleFor(x => x.ProposedStartAt)
            .NotEmpty().WithMessage("ProposedStartAt is required.");

        RuleFor(x => x.ProposedEndAt)
            .NotEmpty().WithMessage("ProposedEndAt is required.")
            .GreaterThan(x => x.ProposedStartAt).WithMessage("ProposedEndAt must be after ProposedStartAt.");

        When(x => !string.IsNullOrWhiteSpace(x.Reason), () =>
        {
            RuleFor(x => x.Reason)
                .MaximumLength(500).WithMessage("Reason cannot exceed 500 characters.");
        });
    }
}
