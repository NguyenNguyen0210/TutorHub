using FluentValidation;

namespace TutorHub.Application.Features.StudentWallets.Commands.RequestTopUp;

public class RequestTopUpCommandValidator : AbstractValidator<RequestTopUpCommand>
{
    public RequestTopUpCommandValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThanOrEqualTo(10_000m)
            .WithMessage("Top-up amount must be at least 10,000 VND.");
    }
}
