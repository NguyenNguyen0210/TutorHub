using FluentValidation;

namespace TutorHub.Application.Features.PlatformSettings.Commands.AdminUpsertPlatformSetting;

public class AdminUpsertPlatformSettingCommandValidator : AbstractValidator<AdminUpsertPlatformSettingCommand>
{
    public AdminUpsertPlatformSettingCommandValidator()
    {
        RuleFor(x => x.Key)
            .NotEmpty().WithMessage("Setting key is required.")
            .Must(k => PlatformSettingKeys.All.Contains(k))
            .WithMessage($"Setting key must be one of: {string.Join(", ", PlatformSettingKeys.All)}.");
        RuleFor(x => x.Value)
            .NotEmpty().WithMessage("Setting value is required.")
            .MaximumLength(500).WithMessage("Setting value cannot exceed 500 characters.");
        RuleFor(x => x.AdminUserId).NotEmpty();
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Change reason is required.")
            .MaximumLength(500).WithMessage("Change reason cannot exceed 500 characters.");
    }
}
