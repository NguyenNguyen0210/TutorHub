using FluentValidation;

namespace TutorHub.Application.Features.Reports.ReportUser;

public class ReportUserCommandValidator : AbstractValidator<ReportUserCommand>
{
    public ReportUserCommandValidator()
    {
        RuleFor(x => x.ReporterUserId).NotEmpty();
        RuleFor(x => x.TargetUserId).NotEmpty();

        RuleFor(x => x)
            .Must(x => x.ReporterUserId != x.TargetUserId)
            .WithMessage("Users cannot report themselves.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason for reporting is required.")
            .MinimumLength(10).WithMessage("Reason must be at least 10 characters.")
            .MaximumLength(2000).WithMessage("Reason cannot exceed 2000 characters.");

        RuleFor(x => x.EvidenceUrl)
            .MaximumLength(500)
            .When(x => !string.IsNullOrEmpty(x.EvidenceUrl));
    }
}
