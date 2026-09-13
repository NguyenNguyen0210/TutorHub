using FluentValidation;

namespace TutorHub.Application.Features.Sessions.Reschedule.RejectReschedule;

public class RejectSessionRescheduleCommandValidator : AbstractValidator<RejectSessionRescheduleCommand>
{
    public RejectSessionRescheduleCommandValidator()
    {
        RuleFor(x => x.SessionId)
            .NotEmpty().WithMessage("SessionId is required.");

        RuleFor(x => x.RequestId)
            .NotEmpty().WithMessage("RequestId is required.");

        RuleFor(x => x.RejectionReason)
            .MaximumLength(500).WithMessage("Rejection reason must not exceed 500 characters.");
    }
}
