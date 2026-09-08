using FluentValidation;

namespace TutorHub.Application.Features.Agreements.Commands.CancelCustomAgreement;

public class CancelCustomAgreementCommandValidator : AbstractValidator<CancelCustomAgreementCommand>
{
    public CancelCustomAgreementCommandValidator()
    {
        RuleFor(x => x.AgreementId).NotEmpty();
        RuleFor(x => x.TutorUserId).NotEmpty();

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Cancellation reason is required.")
            .MinimumLength(5).WithMessage("Cancellation reason must be at least 5 characters.")
            .MaximumLength(500).WithMessage("Cancellation reason cannot exceed 500 characters.");
    }
}
