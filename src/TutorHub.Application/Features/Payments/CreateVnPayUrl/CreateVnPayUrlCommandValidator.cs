using FluentValidation;

namespace TutorHub.Application.Features.Payments.CreateVnPayUrl;

public class CreateVnPayUrlCommandValidator : AbstractValidator<CreateVnPayUrlCommand>
{
    public CreateVnPayUrlCommandValidator()
    {
        RuleFor(x => x.BookingId)
            .NotEmpty()
            .WithMessage("BookingId is required.");

        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("UserId is required.");

        RuleFor(x => x.IpAddress)
            .NotEmpty()
            .WithMessage("IpAddress is required.");
    }
}
