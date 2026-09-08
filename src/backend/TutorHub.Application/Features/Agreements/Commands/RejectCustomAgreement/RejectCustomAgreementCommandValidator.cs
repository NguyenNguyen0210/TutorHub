using FluentValidation;

namespace TutorHub.Application.Features.Agreements.Commands.RejectCustomAgreement;

public class RejectCustomAgreementCommandValidator : AbstractValidator<RejectCustomAgreementCommand>
{
    public RejectCustomAgreementCommandValidator()
    {
        RuleFor(x => x.AgreementId).NotEmpty();
        RuleFor(x => x.StudentUserId).NotEmpty();

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Rejection reason is required.")
            .MinimumLength(5).WithMessage("Rejection reason must be at least 5 characters.")
            .MaximumLength(500).WithMessage("Rejection reason cannot exceed 500 characters.");
    }
}
