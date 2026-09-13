using FluentValidation;

namespace TutorHub.Application.Features.Agreements.Commands.CheckoutCustomAgreement;

public class CheckoutCustomAgreementCommandValidator : AbstractValidator<CheckoutCustomAgreementCommand>
{
    public CheckoutCustomAgreementCommandValidator()
    {
        RuleFor(x => x.AgreementId).NotEmpty();
    }
}
