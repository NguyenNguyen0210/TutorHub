using FluentValidation;

namespace TutorHub.Application.Features.StudentWallets.Commands.CreateVnPayTopUp;

public class CreateVnPayTopUpCommandValidator : AbstractValidator<CreateVnPayTopUpCommand>
{
    public CreateVnPayTopUpCommandValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThanOrEqualTo(10_000m)
            .WithMessage("Top-up amount must be at least 10,000 VND.");
    }
}
