using FluentValidation;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Disputes.Commands.AdminResolveDispute;

public class AdminResolveDisputeCommandValidator : AbstractValidator<AdminResolveDisputeCommand>
{
    public AdminResolveDisputeCommandValidator()
    {
        RuleFor(x => x.DisputeId).NotEmpty();
        RuleFor(x => x.AdminNotes).NotEmpty().MaximumLength(2000);

        When(x => x.Decision == DisputeResolutionDecision.StudentWinsPartialRefund, () =>
        {
            RuleFor(x => x.CustomRefundAmount)
                .NotNull().WithMessage("Custom refund amount is required for partial refund.")
                .GreaterThan(0).WithMessage("Custom refund amount must be greater than 0.");
        });
    }
}
