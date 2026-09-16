using FluentValidation;

namespace TutorHub.Application.Features.Payments.InitiatePayment;

public class InitiatePaymentCommandValidator : AbstractValidator<InitiatePaymentCommand>
{
    public InitiatePaymentCommandValidator()
    {
        RuleFor(x => x.BookingId)
            .NotEmpty()
            .WithMessage("BookingId is required.");

        RuleFor(x => x.IpAddress)
            .NotEmpty()
            .WithMessage("IpAddress is required.");
    }
}
