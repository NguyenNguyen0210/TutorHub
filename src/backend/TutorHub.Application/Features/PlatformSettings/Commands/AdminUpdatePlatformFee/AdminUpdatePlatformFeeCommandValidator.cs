using FluentValidation;

namespace TutorHub.Application.Features.PlatformSettings.Commands.AdminUpdatePlatformFee;

public class AdminUpdatePlatformFeeCommandValidator : AbstractValidator<AdminUpdatePlatformFeeCommand>
{
    public AdminUpdatePlatformFeeCommandValidator()
    {
        RuleFor(x => x.NewFeeRate)
            .InclusiveBetween(0.00m, 0.50m)
            .WithMessage("Platform fee rate must be between 0% (0.00) and 50% (0.50).");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason for fee change is required for platform governance audit.")
            .MaximumLength(500);
    }
}
