using FluentValidation;

namespace TutorHub.Application.Features.Agreements.Commands.AcceptCustomAgreement;

public class AcceptCustomAgreementCommandValidator : AbstractValidator<AcceptCustomAgreementCommand>
{
    public AcceptCustomAgreementCommandValidator()
    {
        RuleFor(x => x.AgreementId).NotEmpty();
    }
}
